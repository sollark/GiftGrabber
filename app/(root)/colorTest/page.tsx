import { tokens } from '@/ui/colorTokens'
import { Box } from '@mui/material'
import { FC } from 'react'

const ColorTestPage: FC = () => {
  const lightColorTokens = tokens('light')
  const darkColorTokens = tokens('dark')

  const renderColorBoxes = (colorTokens: ReturnType<typeof tokens>) => (
    <div>
      {Object.entries(colorTokens).map(([colorName, colorValues]) => (
        <div key={colorName}>
          <h2 style={{ margin: 0 }}>{colorName}</h2> {/* Reset margin here */}
          {Object.entries(colorValues).map(([shade, color]) => (
            <Box
              key={shade}
              sx={{
                backgroundColor: color,
                width: 100,
                height: 100,
                display: 'inline-block',
                margin: 1,
              }}>
              <p style={{ color: '#fff', padding: '10px' }}>
                {shade}: {color}
              </p>
            </Box>
          ))}
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <h1>Light Mode</h1>
      {renderColorBoxes(lightColorTokens)}
      <h1>Dark Mode</h1>
      {renderColorBoxes(darkColorTokens)}
    </div>
  )
}

export default ColorTestPage
