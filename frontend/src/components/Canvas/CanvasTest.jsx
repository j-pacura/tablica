import React, { useEffect, useRef } from 'react';

const CanvasTest = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref is null!');
      return;
    }

    console.log('Canvas found!', canvas);
    const ctx = canvas.getContext('2d');

    // Draw grid
    ctx.strokeStyle = '#ddd';
    for (let i = 0; i < 70; i++) {
      ctx.moveTo(i * 20, 0);
      ctx.lineTo(i * 20, 800);
      ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.moveTo(0, i * 20);
      ctx.lineTo(1400, i * 20);
      ctx.stroke();
    }

    // Draw test text
    ctx.fillStyle = 'red';
    ctx.font = '30px Arial';
    ctx.fillText('CANVAS DZIAŁA! Kliknij i rysuj!', 400, 400);

    // Enable drawing
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      lastX = e.offsetX;
      lastY = e.offsetY;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
      lastX = e.offsetX;
      lastY = e.offsetY;
    });

    canvas.addEventListener('mouseup', () => {
      isDrawing = false;
    });

  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1>TEST CANVAS - Czy działa?</h1>
      <div style={{ border: '2px solid black', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={1400}
          height={800}
          style={{ backgroundColor: 'white', display: 'block' }}
        />
      </div>
    </div>
  );
};

export default CanvasTest;
