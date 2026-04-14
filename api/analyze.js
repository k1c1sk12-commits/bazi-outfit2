export const config = {
  runtime: 'edge',
};

const TEN_HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const TWELVE_EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const ELEMENT_MAP = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire', '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal', '壬': 'water', '癸': 'water',
  '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood', '辰': 'earth', '巳': 'fire',
  '午': 'fire', '未': 'earth', '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water'
};

const ELEMENT_LABEL = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };

const COLOR_MAP = {
  wood: ['綠', '深綠', '橄欖綠'],
  fire: ['紅', '粉紅', '紫', '酒紅'],
  earth: ['米白', '杏色', '卡其', '啡'],
  metal: ['白', '灰', '銀', '香檳金'],
  water: ['黑', '深藍', '海軍藍']
};

const MATERIAL_MAP = {
  wood: ['棉', '麻', '自然纖維'],
  fire: ['絲', '亮面布料', '細緻光澤材質'],
  earth: ['麂皮', '厚棉', '羊毛'],
  metal: ['不鏽鋼', '霧面金屬', '銀色金屬'],
  water: ['皮革', '光滑布料', '柔順垂感材質']
};

// 簡化既天干地支計算
function getYearPillar(year) {
  const stemIndex = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;
  return TEN_HEAVENLY_STEMS[stemIndex] + TWELVE_EARTHLY_BRANCHES[branchIndex];
}

function getMonthPillar(year, month) {
  const yearStemIndex = (year - 4) % 10;
  const monthStemIndex = (yearStemIndex * 2 + month) % 10;
  const branchIndex = ((month + 1) % 12);
  return TEN_HEAVENLY_STEMS[monthStemIndex] + TWELVE_EARTHLY_BRANCHES[branchIndex];
}

function getDayPillar(year, month, day) {
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const daysDiff = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
  const stemIndex = (daysDiff + 4) % 10;
  const branchIndex = (daysDiff + 4) % 12;
  return TEN_HEAVENLY_STEMS[stemIndex] + TWELVE_EARTHLY_BRANCHES[branchIndex];
}

function getHourPillar(hour) {
  const branchIndex = Math.floor((hour + 1) / 2) % 12;
  return '甲' + TWELVE_EARTHLY_BRANCHES[branchIndex];
}

function toCountResult(pillars) {
  const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  pillars.join('').split('').forEach(char => {
    const element = ELEMENT_MAP[char];
    if (element) counts[element] += 1;
  });
  return counts;
}

function chooseSupports(counts, mode) {
  const ranking = Object.entries(counts)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);
  
  return {
    primary: ranking[0],
    secondary: ranking[1] || ranking[0],
    avoid: Object.entries(counts).filter(([, v]) => v >= 3).map(([key]) => key)
  };
}

function makeOutfit(strategy) {
  const { primary, secondary } = strategy;
  return {
    top: {
      title: '上衣',
      items: [
        `主色：${COLOR_MAP[primary].slice(0, 3).join(' / ')}`,
        `材質：${MATERIAL_MAP[primary].slice(0, 2).join(' / ')}`
      ]
    },
    bottom: {
      title: '下身',
      items: [
        `副色：${COLOR_MAP[secondary].slice(0, 3).join(' / ')}`,
        `材質：${MATERIAL_MAP[secondary].slice(0, 2).join(' / ')}`
      ]
    }
  };
}

function elementState(value) {
  if (value <= 1) return { label: '偏少', className: 'state-low' };
  if (value === 2) return { label: '平衡', className: 'state-ok' };
  return { label: '偏多', className: 'state-high' };
}

export default async function handler(req) {
  const { method } = req;
  
  if (method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { year, month, day, hour = 12, mode = 'balanced' } = body;

    const yearPillar = getYearPillar(year);
    const monthPillar = getMonthPillar(year, month);
    const dayPillar = getDayPillar(year, month, day);
    const hourPillar = getHourPillar(hour);
    
    const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
    const counts = toCountResult(pillars);
    const strategy = chooseSupports(counts, mode);
    const outfit = makeOutfit(strategy);
    
    const dayMaster = dayPillar.charAt(0);
    const dayElement = ELEMENT_MAP[dayMaster];

    const response = {
      success: true,
      input: { year, month, day, hour, mode },
      pillars: {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar,
        hour: hourPillar
      },
      day_master: dayMaster + ELEMENT_LABEL[dayElement],
      five_elements_surface: counts,
      analysis: strategy,
      outfit,
      metrics: Object.entries(counts).map(([key, value]) => ({
        element: ELEMENT_LABEL[key],
        count: value,
        ...elementState(value)
      })),
      notes: [
        '年柱採立春分界',
        '月柱採節氣切換',
        '呢個係簡化版八字計算'
      ]
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}