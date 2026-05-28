import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getWeather } from '../../utils/weather'
import type { WeatherData } from '../../types'
import './WeatherBar.css'

export default function WeatherBar() {
  const { theme } = useTheme()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    getWeather().then(setWeather)
    const interval = setInterval(() => {
      getWeather().then(setWeather)
    }, 30 * 60 * 1000) // Refresh every 30 minutes
    return () => clearInterval(interval)
  }, [])

  if (!weather) {
    return (
      <div className={`weather-bar theme-${theme}`}>
        <div className="weather-loading">加载天气中...</div>
      </div>
    )
  }

  return (
    <div
      className={`weather-bar theme-${theme} ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="weather-current">
        <span className="weather-icon">{weather.icon}</span>
        <span className="weather-temp">{weather.temperature}°C</span>
        <span className="weather-condition">{weather.condition}</span>
        <span className="weather-location">{weather.location}</span>
        <span className="weather-toggle">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="weather-details">
          <div className="weather-extra">
            <span>💧 {weather.humidity}%</span>
            <span>💨 {weather.windSpeed}km/h</span>
          </div>
          <div className="weather-forecast">
            {weather.forecast.map((day, i) => (
              <div key={i} className="forecast-day">
                <span className="forecast-day-name">{day.day}</span>
                <span className="forecast-icon">{day.icon}</span>
                <span className="forecast-temp">{day.temperature}°</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
