'use strict'
var jwt = require("jsonwebtoken");
let User = require('../../database').model
const httpStatus = require('http-status')
const { ApiError } = require('../../commons/ApiError')
const l = 80;
const limit = 80000
module.exports = function JustifyText() {
    return async (text, token) => {
        const email = jwt.decode(token, process.env.KEY);
        let selector = { "email": email }
        let user;
        user = await User.findOne(selector)
        if (!user) {
            throw new ApiError({
                message: " Unauthorized requested. Authentication header invalid",
                status: httpStatus.UNAUTHORIZED
            })
        }
        let d = new Date();
        if (user.Date.getFullYear() != d.getFullYear() || d.getMonth() != user.Date.getMonth() || d.getDay() != user.Date.getDay()) {
            user.limit = 0;
            user.Date = new Date();
        }
        user.limit += text.split(' ').length
        if (user.limit > limit) {
            throw new ApiError({
                message: " Payment Required",
                status: httpStatus.PAYMENT_REQUIRED
            })
        }
        user.save();
        return justify(text, l)
    }
}

function justify(text, l) {
    const paraph = text.split('\r\n')
    let lines = [];
    let line = [];
    if (paraph.length === 0) paraph = text.split('\n')

    for (var i = 0; i < paraph.length; i++) {
        paraph[i] = paraph[i].split(' ')
    }

    for (var j = 0; j < paraph.length; j++) {
        for (var k = 0; k < paraph[j].length; k++) {
            line.push(paraph[j][k])
            if (line.join(' ').length > l) {
                line.pop();
                line = appendSpaces(line, l)
                lines.push(line.join(' ') + '\r\n')
                line = []
                line.push(paraph[j][k])
            }
            else {
                if (k == paraph[j].length - 1) {
                    lines.push(line.join(' ') + '\r\n')
                    line = []
                }
            }
        }
    }
    text = ""
    lines.forEach(line => text += line)
    return text;
}

function appendSpaces(line, l) {
    const diff = l - line.join(' ').length
    let i = 0
    while (true) {
        if (line.join(' ').length == l)
            return line;
        else {
            line[i] += ' ';
            i++
            if (i == line.length - 1)
                i = 0;
        }

    }
}
