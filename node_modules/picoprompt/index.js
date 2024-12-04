import { openSync, readSync, closeSync } from 'fs'
import stripAnsi from './libs/strip-ansi.js'

/**
 * Blocking (synchronous) function for reading user input from stdin
 * @param {String} question opening question or statement to prompt for
 * @returns {String} the string input or terminates with a ^C or ^D
 */
function prompt(question) {
  if (typeof question !== 'string') {
    return console.error('Question must be a string')
  }

  // file descriptor for stdin https://en.wikipedia.org/wiki/File_descriptor
  const fd = (process.platform === 'win32') ? process.stdin.fd : openSync('/dev/tty', 'rs')

  // Save the current isRaw state of the terminal
  const wasRaw = process.stdin.isRaw
  if (!wasRaw) { process.stdin.setRawMode && process.stdin.setRawMode(true) }

  process.stdout.write(question)

  let buf = Buffer.alloc(3) // holds the input bytes
  let str = '' // holds the input string
  let cursorPosition = 0 // holds the cursor position

  while (true) {
    // ANSI escape codes reference https://en.wikipedia.org/wiki/ANSI_escape_code
    const bytesRead = readSync(fd, buf, 0, 3)

    // handle a 2 or 3 byte sequence
    if (bytesRead > 1) {
      switch(buf.toString()) {
        case '\u001b[D': // left arrow
          var before = cursorPosition
          cursorPosition = (--cursorPosition < 0) ? 0 : cursorPosition
          if (before - cursorPosition)
            process.stdout.write('\u001b[1D')
          break
        case '\u001b[C': // right arrow
          cursorPosition = (++cursorPosition > str.length) ? str.length : cursorPosition
          process.stdout.write('\u001b[' + (cursorPosition+question.length+1) + 'G')
          break
        case '\u001b[A': // up arrow, NOOP
        case '\u001b[B': // down arrow, NOOP
          break
        default:
          if (buf.toString()) {
            str = str + buf.toString()
            str = str.replace(/\0/g, '') // remove null characters
            cursorPosition = str.length
            promptPrint(question, str, cursorPosition)
            process.stdout.write('\u001b[' + (cursorPosition+question.length+1) + 'G')
            buf = Buffer.alloc(3)
          }
      }
      continue // any other 3 character sequence is ignored
    }

    // handle a control character seq, assume only one character is read
    const character = buf[bytesRead-1]

    // handle ^C and kill the process
    if (character == 3){
      process.stdout.write('^C\n')
      closeSync(fd)
      process.exit(130)
    }

    // handle ^D and kill the process
    if (character == 4) {
      if (str.length == 0) {
        process.stdout.write('exit\n')
        process.exit(0)
      }
    }

    // handle the terminating character
    const CARRIAGE_RETURN = 13
    if (character == CARRIAGE_RETURN) {
      closeSync(fd)
      break
    }

    // handle backspace
    if (character == 127 || (process.platform == 'win32' && character == 8)) {
      if (!cursorPosition) {
        continue // ignore backspace at the beginning of the line
      }
      str = str.slice(0, cursorPosition-1) + str.slice(cursorPosition)
      cursorPosition--
      process.stdout.write('\u001b[2D')
      continue
    }

    // ignore non-printable characters https://en.wikipedia.org/wiki/ASCII#Printable_characters
    if ((character < 32 ) || (character > 126)) {
      continue
    }

    // append the input character to the string
    str = str.slice(0, cursorPosition) + String.fromCharCode(character) + str.slice(cursorPosition)
    cursorPosition++

    promptPrint(question, str, cursorPosition)
  }

  process.stdout.write('\n')
  process.stdin.setRawMode && process.stdin.setRawMode(wasRaw)

  return str
}

function promptPrint(question, str, insert) {
  // Save the cursor position, clear the line, move the cursor to the beginning
  process.stdout.write('\u001b[s')
  process.stdout.write('\u001b[2K\u001b[0G'+ question + str)

  // Reposition the cursor to the right of the insertion point
  const askLength = stripAnsi(question).length
  process.stdout.write(`\u001b[${askLength+1+insert}G`)
}

export default prompt
