const mongoose = require("mongoose")
const { integer } = require("neo4j-driver")
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
            documents: 
            [
                {
                    name: String,
                    document: Buffer
                }
            ]
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
                    question: String,
                    opcion1: String,
                    opcion2: String,
                    opcion3: String,
                    opcion4: String,
                    correct: Number
                }
            ]
        }
    ]
})

const collection = new mongoose.model("Courses", courseSchema)
module.exports = collection