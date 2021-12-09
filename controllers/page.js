const fs = require('fs');
const path = require('path');

// 控制台
const admin = async (ctx) => {
    ctx.response.type = 'html';
    ctx.body = await fs.readFileSync(path.resolve(__dirname, '../assest/admin.html'));
};

module.exports = {
    admin,
}