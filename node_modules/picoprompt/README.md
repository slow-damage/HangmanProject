# Picoprompt

A very simple sync prompt for node **for educational purposes**.

The goal of this is to be as simple as possible for usage in education. It enables students to practice with simple user inputs early on, without callbacks or promises.

Dependencies are inlined, ESM only.

## Installation

- Install with `npm install picoprompt`
- Add `"type": "module"` into package.json

- Minimal example of `package.json`

    ```json
    {
        "type": "module",
        "dependencies": {
            "picoprompt": "^5.0.0"
        }
    }
    ```

## Usage

```js
import prompt from 'picoprompt'

const name = prompt('What is your name? ')
console.log(`Hello ${name}!`)
```

## Line editing

Use backspace and left/right arrows for editing.
