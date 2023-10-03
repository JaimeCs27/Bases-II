const mongoose = require("mongoose")
const { integer } = require("neo4j-driver")
const { Schema } = mongoose

const courseSchema = new Schema ({
    id: String,
    name: String,
    description: String,
    start: Date,
    end: Date,
    imgPath: String,
    sections:
    [
        {
            description: String,
            documents: 
            [
                {
                    path: String,
                    name: String
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

courseSchema.virtual('imgSrc').get(function () {
    if (this.sections[1].documents[1].document != null) {
        const base64EncodedDocument = this.sections[1].documents[1].document.toString('base64');
        return `data:${this.sections[1].documents[1].mimetype};charset=utf-8;base64,${base64EncodedDocument}`;
    }
});



const collection = new mongoose.model("Courses", courseSchema)
module.exports = collection