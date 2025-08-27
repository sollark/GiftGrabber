require("dotenv").config();
// Polyfill for TextEncoder/TextDecoder in Jest (Node <18)
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
