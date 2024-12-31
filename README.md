# Python Test Case Generator

A web application that analyzes Python code, generates test cases, and provides code quality insights.

## Features

### 1. Code Analysis

- Automatic function detection
- Type hint analysis
- Complexity metrics calculation
- Code quality suggestions
- Best practice recommendations

### 2. Test Case Generation

- Generates edge cases based on type hints
- Supports multiple test categories:
  - Boundary cases
  - Edge cases
  - Error cases
- Export tests in different formats (pytest/unittest)

### 3. User Interface

- Interactive code editor with syntax highlighting
- Dark/Light theme toggle
- Split view layout
- Collapsible test case sections
- Copy-to-clipboard functionality
- Test case filtering by category

## Project Structure

```
python_test_generator/
├── app.py                 # Main Flask application
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Custom styles
│   └── js/
│       └── main.js       # Frontend functionality
└── requirements.txt      # Project dependencies
```

## Installation

1. Clone the repository

```bash
git clone
cd python_test_generator
```

2. Create and activate virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Unix/MacOS
source venv/bin/activate
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the Flask server

```bash
python app.py
```

2. Open your browser and navigate to `http://localhost:5000`

## Code Examples

### Example Input

```python
def calculate_discount(price: int, discount_percentage: int) -> float:
    if discount_percentage < 0 or discount_percentage > 100:
        raise ValueError("Discount percentage must be between 0 and 100")
    return price * (1 - discount_percentage / 100)
```

### Generated Test Cases

```python
def test_calculate_discount_boundary():
    try:
        result = calculate_discount(0, discount_percentage)
        assert result is not None
    except Exception as e:
        pass

def test_calculate_discount_edge():
    try:
        result = calculate_discount(-1, discount_percentage)
        assert result is not None
    except Exception as e:
        pass
```

## Dependencies

- Flask==3.0.0
- radon==3.2.6

## Features in Detail

### Code Analysis

- Function detection using Python's AST
- Type hint analysis for parameters and return types
- Cyclomatic complexity calculation
- Code quality suggestions including:
  - Missing docstrings
  - Missing type hints
  - Function complexity warnings

### Test Case Generation

- Generates test cases based on parameter types
- Supports different test categories
- Handles edge cases for common data types:
  - Integers (0, -1, MAX_INT)
  - Strings (empty, very long, special characters)
  - Lists (empty, large, None values)

### UI Features

- Syntax highlighting using CodeMirror
- Real-time code analysis
- Theme switching (light/dark)
- Test case organization and filtering
- Export functionality
