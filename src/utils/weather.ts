import type { WeatherData } from '../types'

// Mock weather data generator
const CONDITIONS = [
  { condition: '晴', icon: '☀️' },
  { condition: '多云', icon: '⛅' },
  { condition: '阴', icon: '☁️' },
  { condition: '小雨', icon: '🌧️' },
  { condition: '中雨', icon: '🌧️' },
  { condition: '雷阵雨', icon: '⛈️' },
  { condition: '雪', icon: '❄️' },
  { condition: '雾', icon: '🌫️' },
]

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function getRandomCondition() {
  return CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]
}

function getRandomTemp(base: number) {
  return Math.round(base + (Math.random() * 10 - 5))
}

export function generateMockWeather(): WeatherData {
  const today = new Date()
  const currentCondition = getRandomCondition()
  const baseTemp = today.getMonth() >= 4 && today.getMonth() <= 9 ? 28 : 12

  const forecast = []
  for (let i = 1; i <= 3; i++) {
    const forecastDate = new Date(today)
    forecastDate.setDate(today.getDate() + i)
    const fc = getRandomCondition()
    forecast.push({
      day: DAY_NAMES[forecastDate.getDay()],
      temperature: getRandomTemp(baseTemp),
      condition: fc.condition,
      icon: fc.icon,
    })
  }

  return {
    temperature: getRandomTemp(baseTemp),
    condition: currentCondition.condition,
    icon: currentCondition.icon,
    humidity: Math.round(40 + Math.random() * 40),
    windSpeed: Math.round(5 + Math.random() * 20),
    location: '北京',
    forecast,
  }
}

// Cache weather data for 30 minutes
let cachedWeather: WeatherData | null = null
let cacheTime = 0

export async function getWeather(): Promise<WeatherData> {
  const now = Date.now()
  if (cachedWeather && now - cacheTime < 30 * 60 * 1000) {
    return cachedWeather
  }
  
  cachedWeather = generateMockWeather()
  cacheTime = now
  return cachedWeather
}
