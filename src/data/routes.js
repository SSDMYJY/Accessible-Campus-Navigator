/*
 * routes.js — 无障碍校园导航的模拟数据。
 *
 * 每条路线描述的是校园中两个命名地点之间的一条无台阶(或台阶减少的)无障碍
 * 路径。在真实产品中,这些数据会来自路径规划 API;此处为硬编码,以便应用
 * 在完全离线的情况下也能正常工作(这正是 service worker 设计支持的场景)。
 *
 * 数据模型对屏幕阅读器友好:`steps` 是一组简短的祈使句,使语音合成播报
 * 自然顺畅;`features` 是一组面向人类可读的徽章字符串。
 */

export const ROUTES = [
  {
    id: 'dorm-canteen-1',
    origin: '宿舍楼',
    destination: '第一食堂',
    distanceMeters: 320,
    estMinutes: 5,
    accessible: { ramp: true, elevator: false, tactilePaving: true, stepFree: true },
    features: ['无台阶', '坡道', '盲道'],
    steps: [
      '从宿舍楼大厅经西侧坡道出门',
      '沿 A 楼盲道前行约 80 米',
      '穿过有顶连廊进入中央广场',
      '继续直行,第一食堂入口为右侧第二个门',
    ],
    safetyNote: '请避开 C 楼附近的施工区域,仅使用西侧坡道。',
  },
  {
    id: 'dorm-library-1',
    origin: '宿舍楼',
    destination: '图书馆',
    distanceMeters: 480,
    estMinutes: 8,
    accessible: { ramp: true, elevator: true, tactilePaving: false, stepFree: true },
    features: ['无台阶', '坡道', '电梯'],
    steps: [
      '从宿舍楼东侧坡道出门',
      '沿有顶步道前往图书馆西入口',
      '使用无障碍电梯到达 2 楼主阅览室',
    ],
    safetyNote: '南侧楼梯正在维护,请使用电梯。',
  },
  {
    id: 'shayuan-north-exit',
    origin: '沙园站',
    destination: '北出口(无障碍)',
    distanceMeters: 120,
    estMinutes: 3,
    accessible: { ramp: true, elevator: false, tactilePaving: true, stepFree: true },
    features: ['无台阶', '坡道', '盲道', '宽通道闸机'],
    steps: [
      '下车后沿盲道前往站厅',
      '走北侧通道,经过检票闸机',
      '使用左侧的宽通道无障碍闸机',
      '北出口坡道直通地面',
    ],
    safetyNote: '南出口仅有楼梯,需要无台阶通行时请勿使用。',
  },
  {
    id: 'shayuan-south-exit',
    origin: '沙园站',
    destination: '南出口(电梯)',
    distanceMeters: 180,
    estMinutes: 4,
    accessible: { ramp: false, elevator: true, tactilePaving: true, stepFree: true },
    features: ['无台阶', '电梯', '盲道'],
    steps: [
      '下车后沿盲道前往站厅',
      '走南侧通道,前往 3、4 号站台方向',
      '乘电梯到达地面(按钮带盲文标识)',
      '从南侧闸机出站',
    ],
    safetyNote: '电梯每周二 03:00–04:00 例行检查,该时段请使用北出口坡道。',
  },
  {
    id: 'canteen-sports-1',
    origin: '第一食堂',
    destination: '体育馆',
    distanceMeters: 260,
    estMinutes: 4,
    accessible: { ramp: true, elevator: false, tactilePaving: false, stepFree: true },
    features: ['无台阶', '坡道'],
    steps: [
      '从第一食堂东门出门',
      '沿平整步道经过篮球场',
      '通过小天桥(宽 1.8 米,无台阶)',
      '体育馆无障碍入口位于北侧',
    ],
    safetyNote: '',
  },
  {
    id: 'library-restroom-1',
    origin: '图书馆',
    destination: '无障碍卫生间(B 楼 2 层)',
    distanceMeters: 60,
    estMinutes: 2,
    accessible: { ramp: false, elevator: true, tactilePaving: false, stepFree: true },
    features: ['无台阶', '电梯', '宽门', '扶手'],
    steps: [
      '从图书馆主阅览室向东前往 B 楼',
      '如不在 2 层,先乘电梯到达 2 层',
      '无障碍卫生间为右侧第二个门,门上有国际通用的无障碍标识',
    ],
    safetyNote: '',
  },
]
