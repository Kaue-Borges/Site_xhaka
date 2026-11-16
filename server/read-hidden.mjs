export function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new Error("Execute em um terminal interativo."));
    let value = "";
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = (result, error) => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(result);
    };
    const onData = (data) => {
      for (const char of data.toString("utf8")) {
        if (char === "\r" || char === "\n") return finish(value);
        if (char === "\u0003") return finish(null, new Error("Cancelado."));
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " " && char !== "\u007f") value += char;
      }
    };
    process.stdin.on("data", onData);
  });
}
