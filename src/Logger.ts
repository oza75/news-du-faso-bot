const fs = require('fs');

class Logger {
    static log(...args: any[]) {
        let date = new Date().toDateString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');

        let fileName: string = 'bot-' + date + '.log';
        let data: string = args.map(it => {
            return '[' + new Date().toLocaleString() + '] ' + it + '\n';
        }).join('');
        try {
            fs.writeFileSync(__dirname + '/' + fileName, data, {flag: 'a+'});
        } catch (e) {
            console.log(...args, e);
        }
    }
}

export default Logger;
