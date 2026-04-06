const csv = require("csv-parser");
const { Readable } = require("stream");

// Notice spaces in header
const buffer = Buffer.from("category, subTopic, questionText, difficulty, option1, option2, option3, option4, correctIndex, explanation\nMath,Basic,1+1?,EASY,1,2,3,4,1,Because");

const stream = Readable.from(buffer.toString());
const results = [];
stream.pipe(csv())
  .on("data", (data) => results.push(data))
  .on("end", () => console.log(results))
  .on("error", (err) => console.error(err));
