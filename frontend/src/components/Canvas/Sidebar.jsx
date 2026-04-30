import React from 'react';

const Sidebar = ({
  currentColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  currentTool
}) => {
  const colors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
  ];

  return (
    <div className="w-64 bg-neutral-50 border-l border-neutral-200 p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Ustawienia narzędzia</h3>

      {/* Current Tool Display */}
      <div className="mb-6 p-3 bg-white rounded-lg border border-neutral-200">
        <p className="text-sm text-neutral-600 mb-1">Aktywne narzędzie:</p>
        <p className="font-medium capitalize">{currentTool}</p>
      </div>

      {/* Color Picker */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Kolor
        </label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`
                w-12 h-12 rounded border-2 transition-all
                ${
                  currentColor === color
                    ? 'border-primary scale-110'
                    : 'border-neutral-300 hover:border-neutral-400'
                }
              `}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Custom Color Input */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">Własny:</label>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-10 rounded border border-neutral-300 cursor-pointer"
          />
        </div>

        {/* Current Color Display */}
        <div className="mt-2 text-xs text-neutral-500 text-center">
          {currentColor.toUpperCase()}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Grubość: {strokeWidth}px
        </label>
        <input
          type="range"
          min="1"
          max="50"
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>1px</span>
          <span>50px</span>
        </div>
      </div>

      {/* Preview */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Podgląd
        </label>
        <div className="bg-white p-4 rounded border border-neutral-200 flex items-center justify-center h-20">
          <div
            style={{
              width: `${Math.min(strokeWidth * 10, 200)}px`,
              height: `${strokeWidth}px`,
              backgroundColor: currentColor,
              opacity: currentTool === 'highlighter' ? 0.3 : 1
            }}
            className="rounded"
          />
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 p-3 bg-blue-50 rounded text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 Skróty klawiszowe:</p>
        <ul className="text-xs space-y-1">
          <li>S - Zaznacz</li>
          <li>P - Ołówek</li>
          <li>B - Długopis</li>
          <li>E - Gumka</li>
          <li>L - Linia</li>
          <li>R - Prostokąt</li>
          <li>C - Koło</li>
          <li>Ctrl+Z - Cofnij</li>
          <li>Ctrl+Y - Ponów</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
