const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;

const config = require('./settings.json');


function createBot() {
   const bot = mineflayer.createBot({
      username: config['bot-account']['username'],
      password: config['bot-account']['password'],
      auth: config['bot-account']['type'],
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version,
   });


var moveinterval = 1;
var maxrandom = 51
var lasttime = -1;
var moving = 0;
var connected = 1;

var actions = [ 'forward', 'back', 'left', 'right']
var lastaction;
var pi = 3.14159;



function getRandomArbitrary(min, max) {
      return Math.random() * (max - min) + min;
   }



bot.on('chat', function(username, message) {
  if (username === bot.username) return;
  console.log(message);
});

if (config.randomafk.enabled) {
        bot.on('time', function() {
            if (connected <1) {
                return;
            }
            if (lasttime<0) {
                lasttime = bot.time.age;
                console.log("[INFO] 时间设置为 " + lasttime)
            } else {
                var randomadd = Math.random() * maxrandom * 20;
                var interval = moveinterval*20 + randomadd;
                if (bot.time.age - lasttime > interval) {
                    if (moving == 1) {
                        bot.setControlState(lastaction,false);
                        moving = 0;
                        console.log("[AFK] 在 " + (interval/20) + " 秒后停止移动。");
                        lasttime = bot.time.age;
                    } else {
                        var yaw = Math.random()*pi - (0.5*pi);
                        var pitch = Math.random()*pi - (0.5*pi);
                        bot.look(yaw,pitch,false);
                        console.log("[AFK] 将观察方向更改为偏航" + yaw + " 俯仰 " + pitch);

                        lastaction = actions[Math.floor(Math.random() * actions.length)];
                        bot.setControlState(lastaction,true);
                        moving = 1;
                        console.log("[AFK] 在" + lastaction +" 位置后移动 " + (interval/20) + " 历经秒数");
                        lasttime = bot.time.age;
                        bot.activateItem();
                    }
                }
            }
        });
      }

   bot.loadPlugin(pathfinder);
   const mcData = require('minecraft-data')(bot.version);
   const defaultMove = new Movements(bot, mcData);
   bot.settings.colorsEnabled = false;

   bot.once('spawn', () => {
      console.log('\x1b[33m[AFK] 人机已加入游戏。', '\x1b[0m');

      if (config.utils['auto-auth'].enabled) {
         console.log('[INFO] 开启自动登陆功能');

         var password = config.utils['auto-auth'].password;
         setTimeout(() => {
            bot.chat(`/register ${password} ${password}`);
            bot.chat(`/login ${password}`);
         }, 500);

         console.log(`[Auth] 已执行登陆命令。`);
      }

      if (config.utils['chat-messages'].enabled) {
         console.log('[INFO] 启用消息发送功能');
         var messages = config.utils['chat-messages']['messages'];

         if (config.utils['chat-messages'].repeat) {
            var delay = config.utils['chat-messages']['repeat-delay'];
            let i = 0;

            setInterval(() => {
               bot.chat(`${messages[i]}`);

               if (i + 1 == messages.length) {
                  i = 0;
               } else i++;
            }, delay * 1000);
         } else {
            messages.forEach((msg) => {
               bot.chat(msg);
            });
         }
      }

      const pos = config.position;

      if (config.position.enabled) {
         console.log(
            `\x1b[32m[AFK] 启动目标移动 (${pos.x}, ${pos.y}, ${pos.z})\x1b[0m`
         );
         bot.pathfinder.setMovements(defaultMove);
         bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
      }

      if (config.utils['anti-afk'].enabled) {
         bot.setControlState('jump', true);
         if (config.utils['anti-afk'].sneak) {
            bot.setControlState('sneak', true);
         }
      }
   });

   bot.on('chat', (username, message) => {
      if (config.utils['chat-log']) {
         console.log(`[ChatLog] <${username}> ${message}`);
      }
   });

   bot.on('goal_reached', () => {
      console.log(
         `\x1b[32m[AFK] 人机已移动至. ${bot.entity.position}\x1b[0m`
      );
   });

   bot.on('death', () => {
      console.log(
         `\x1b[33m[AFK] 人机重置传送点 ${bot.entity.position}`,
         '\x1b[0m'
      );
   });

   if (config.utils['auto-reconnect']) {
      bot.on('end', () => {
         setTimeout(() => {
            createBot();
         }, config.utils['auto-recconect-delay']);
      });
   }

   bot.on('kicked', (reason) =>
      console.log(
         '\x1b[33m',
         `[AFK] 人机已被踢出服务器，原因: \n${reason}`,
         '\x1b[0m'
      )
   );
   bot.on('error', (err) =>
      console.log(`\x1b[31m[ERROR] ${err.message}`, '\x1b[0m')
   );
}

createBot();

