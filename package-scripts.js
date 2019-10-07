module.exports = {
    scripts: {
        lint: {
            default: 'tslint -t stylish --project "tsconfig.json"',
            fix: 'tslint -p . --fix',
        }
    }
};
