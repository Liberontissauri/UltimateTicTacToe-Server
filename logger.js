function normal(content) {
    const current_time = new Date().toString()
    console.log(`[${current_time}] ${content} [Normal]`)
}
function warn(content) {
    const current_time = new Date().toString()
    console.warn(`[${current_time}] ${content} [Normal]`)
}
function info(content) {
    const current_time = new Date().toString()
    console.info(`[${current_time}] ${content} [Normal]`)
}
function error(content) {
    const current_time = new Date().toString()
    console.error(`[${current_time}] ${content} [Normal]`)
}

module.exports.normal = normal;
module.exports.warn = warn;
module.exports.info = info;
module.exports.error = error