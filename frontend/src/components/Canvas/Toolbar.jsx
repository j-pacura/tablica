import React from 'react';

const Toolbar = ({ currentTool, onToolChange, onAddShape }) => {
  const tools = [
    { id: 'select', icon: '↖️', label: 'Zaznacz (S)', key: 'S' },
    { id: 'pencil', icon: '✏️', label: 'Ołówek (P)', key: 'P' },
    { id: 'pen', icon: '🖊️', label: 'Długopis (B)', key: 'B' },
    { id: 'marker', icon: '🖍️', label: 'Marker (M)', key: 'M' },
    { id: 'highlighter', icon: '🖍', label: 'Zakreślacz (H)', key: 'H' },
    { id: 'eraser', icon: '🧹', label: 'Gumka (E)', key: 'E' },
  ];

  const shapes = [
    { id: 'line', icon: '📏', label: 'Linia (L)' },
    { id: 'rectangle', icon: '⬜', label: 'Prostokąt (R)' },
    { id: 'circle', icon: '⭕', label: 'Koło (C)' },
  ];

  return (
    <div className="w-16 bg-neutral-100 border-r border-neutral-200 flex flex-col items-center py-4 gap-2">
      {/* Drawing Tools */}
      <div className="flex flex-col gap-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`
              w-12 h-12 rounded flex items-center justify-center text-xl
              transition-colors
              ${
                currentTool === tool.id
                  ? 'bg-primary text-white'
                  : 'bg-neutral-200 hover:bg-neutral-300'
              }
            `}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="w-10 h-px bg-neutral-300 my-2"></div>

      {/* Shapes */}
      <div className="flex flex-col gap-1">
        {shapes.map((shape) => (
          <button
            key={shape.id}
            onClick={() => onAddShape(shape.id)}
            className="
              w-12 h-12 rounded flex items-center justify-center text-xl
              bg-neutral-200 hover:bg-neutral-300 transition-colors
            "
            title={shape.label}
          >
            {shape.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
