from flask import Flask, render_template, request, jsonify, send_file
import ast
from radon.complexity import cc_visit
from radon.metrics import h_visit
import io
from typing import List, Dict, Any

app = Flask(__name__)

class CodeAnalyzer:
    def analyze_code(self, code: str) -> Dict[str, Any]:
        try:
            tree = ast.parse(code)
            complexity_metrics = cc_visit(code)
            halstead_metrics = h_visit(code)
            functions = []

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    func_info = {
                        'name': node.name,
                        'args': [{'name': arg.arg, 'type': self._get_type_hint(arg)} for arg in node.args.args],
                        'returns': self._get_return_hint(node),
                        'complexity': next((m.complexity for m in complexity_metrics if m.name == node.name), 0),
                        'suggestions': self._analyze_function(node),
                        'edge_cases': self._generate_edge_cases(node)
                    }
                    functions.append(func_info)

            return {
    'success': True,
    'functions': functions,
    'metrics': {
        'total_complexity': sum(m.complexity for m in complexity_metrics),
        'total_lines': len(code.splitlines()),
        'complexity_rank': 'Low' if sum(m.complexity for m in complexity_metrics) < 10 else 'Medium' if sum(m.complexity for m in complexity_metrics) < 20 else 'High'
    }
}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _get_type_hint(self, arg):
        return arg.annotation.id if hasattr(arg, 'annotation') and hasattr(arg.annotation, 'id') else 'Any'

    def _get_return_hint(self, node):
        return node.returns.id if hasattr(node, 'returns') and hasattr(node.returns, 'id') else 'Any'

    def _analyze_function(self, node):
        suggestions = []

        if not ast.get_docstring(node):
            suggestions.append({
                'type': 'documentation',
                'message': 'Add docstring to document function purpose and parameters'
            })

        has_type_hints = all(hasattr(arg, 'annotation') for arg in node.args.args)
        if not has_type_hints:
            suggestions.append({
                'type': 'type_hints',
                'message': 'Add type hints to improve code clarity and enable static type checking'
            })

        return suggestions

    def _generate_edge_cases(self, node):
        test_cases = []
        for arg in node.args.args:
            type_hint = self._get_type_hint(arg)
            cases = self._get_type_edge_cases(type_hint)
            for case in cases:
                test_cases.append({
                    'category': case['category'],
                    'description': f"Test {node.name} with {arg.arg} = {case['value']}",
                    'code': self._generate_test_code(node.name, node.args.args, arg, case)
                })
        return test_cases

    def _get_type_edge_cases(self, type_hint):
        cases = []
        if type_hint == 'int':
            cases = [
                {'value': '0', 'category': 'boundary'},
                {'value': '-1', 'category': 'boundary'},
                {'value': 'sys.maxsize', 'category': 'edge'},
                {'value': '-sys.maxsize - 1', 'category': 'edge'}
            ]
        elif type_hint == 'str':
            cases = [
                {'value': '""', 'category': 'boundary'},
                {'value': '"" * 10000', 'category': 'edge'},
                {'value': '"!@#$%^&*()"', 'category': 'edge'}
            ]
        elif type_hint == 'list':
            cases = [
                {'value': '[]', 'category': 'boundary'},
                {'value': '[1] * 1000', 'category': 'edge'},
                {'value': '[None]', 'category': 'edge'}
            ]
        return cases

    def _generate_test_code(self, func_name, all_args, target_arg, case):
        args = [case['value'] if arg.arg == target_arg.arg else 'None' for arg in all_args]
        return f"""def test_{func_name}_{case['category']}():
    try:
        result = {func_name}({', '.join(args)})
        assert result is not None
    except Exception as e:
        pass  # Handle expected exceptions"""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    code = request.json.get('code', '')
    if not code:
        return jsonify({'error': 'No code provided'}), 400

    analyzer = CodeAnalyzer()
    result = analyzer.analyze_code(code)
    return jsonify(result)

@app.route('/export', methods=['POST'])
def export():
    code = request.json.get('code', '')
    format_type = request.json.get('format', 'pytest')

    analyzer = CodeAnalyzer()
    result = analyzer.analyze_code(code)

    if not result['success']:
        return jsonify({'error': 'Analysis failed'}), 400

    test_code = io.StringIO()
    if format_type == 'pytest':
        test_code.write('import pytest\n\n')
    else:
        test_code.write('import unittest\n\n')

    for func in result['functions']:
        for case in func['edge_cases']:
            test_code.write(case['code'] + '\n\n')

    return send_file(
        io.BytesIO(test_code.getvalue().encode()),
        mimetype='text/plain',
        as_attachment=True,
        download_name=f'test_cases.{format_type}.py'
    )

if __name__ == '__main__':
    app.run(debug=True)
