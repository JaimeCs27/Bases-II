const mongoose = require("mongoose")
const { Schema } = mongoose

const courseSchema = new Schema ({
    id: String,
    name: String,
    description: String,
    start: Date,
    end: Date,
    sections:
    [
        {
            description: String,
            document: Buffer
        }
    ],
    students:
    [
        {
            user: String
        }
    ],
    evaluations:
    [
        {
            code: String,
            start: Date,
            end: Date,
            questions:
            [
                {
                    options:
                    [
                        {
                            option: String
                        }
                    ],
                correct: String
                }
            ]
        }
    ]
})

const collection = new mongoose.model("Courses", courseSchema)
module.exports = collection