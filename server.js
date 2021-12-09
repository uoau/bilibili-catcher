/**
 * 启动服务器
 */
const Koa = require('koa');
const routerOrigin = require('koa-router');
const bodyParser = require('koa-bodyparser');
const app = new Koa();
const Page = require('./controllers/page');
const Robot = require('./controllers/robot');
const router = routerOrigin();
router.get("/admin", Page.admin); // 查看器
router.get("/robot-info", Robot.getRobotInfo); // 获取机器人信息
router.post("/add-seed", Robot.addSeed); // 新增种子

app
    .use(bodyParser())
    .use(router.routes());

app.listen(777);