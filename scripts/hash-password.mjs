#!/usr/bin/env node
// Prints the SHA-256 hex digest to paste into SITE_ACCESS_PASSWORD_HASH.
// Must match sha256Hex() in lib/site-auth.ts (UTF-8, no trailing newline).
import { createHash } from "node:crypto"
import { createInterface } from "node:readline"

const TAG = "[hash-password]"

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    let muted = false
    rl._writeToOutput = (text) => {
      if (!muted) rl.output.write(text)
    }
    rl.question(question, (answer) => {
      rl.output.write("\n")
      rl.close()
      resolve(answer)
    })
    muted = true
  })
}

async function readStdin() {
  let data = ""
  for await (const chunk of process.stdin) data += chunk
  return data.replace(/\r?\n$/, "")
}

async function main() {
  let password
  if (process.stdin.isTTY) {
    password = await promptHidden("Password: ")
    const confirm = await promptHidden("Confirm password: ")
    if (password !== confirm) {
      console.error(`${TAG} - passwords do not match.`)
      process.exit(1)
    }
  } else {
    password = await readStdin()
  }

  if (!password) {
    console.error(`${TAG} - password must not be empty.`)
    process.exit(1)
  }

  const hash = createHash("sha256").update(password, "utf8").digest("hex")
  console.log(`${TAG} - add this line to .env and restart the server:`)
  console.log(`SITE_ACCESS_PASSWORD_HASH=${hash}`)
}

main()
