import React, { useRef, useState } from "react";
import "./App.css";

interface Point {
  x: number;
  y: number;
}

// transforms a point from the client coordinate system into the SVG coordinate system
function clientToG(
  svg: SVGSVGElement,
  transform: DOMMatrixReadOnly,
  x: number,
  y: number
): Point {
  const clientPt = new DOMPoint(x, y);
  const svgPt = DOMMatrixReadOnly.fromMatrix(svg.getScreenCTM()!)
    .inverse()
    .transformPoint(clientPt);
  const pt = transform.inverse().transformPoint(svgPt);
  return { x: pt.x, y: pt.y };
}

function App() {
  const svgRef = useRef<SVGSVGElement>(null);

  const [points, setPoints] = useState<Point[]>([]);

  const [viewTransform, setViewTransform] = useState(() =>
    new DOMMatrixReadOnly().translate(
      window.innerWidth / 2,
      window.innerHeight / 2
    )
  );

  const [prevPos, setPrevPos] = useState<Point | undefined>();

  function addPoint() {
    const transformedOrigin = clientToG(svgRef.current!, viewTransform, 0, 0);

    const transformedSize = clientToG(
      svgRef.current!,
      viewTransform,
      window.innerWidth,
      window.innerHeight
    );

    const x =
      Math.random() * (transformedSize.x - transformedOrigin.x) +
      transformedOrigin.x;
    const y =
      Math.random() * (transformedSize.y - transformedOrigin.y) +
      transformedOrigin.y;
    setPoints((ps) => [...ps, { x, y }]);
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    setPrevPos({ x: e.clientX, y: e.clientY });
  }

  function handleMouseUp() {
    setPrevPos(undefined);
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!prevPos) {
      return;
    }

    const transformedPrevPos = clientToG(
      svgRef.current!,
      viewTransform,
      prevPos.x,
      prevPos.y
    );

    const transformedCurPos = clientToG(
      svgRef.current!,
      viewTransform,
      e.clientX,
      e.clientY
    );

    const dx = transformedCurPos.x - transformedPrevPos.x;
    const dy = transformedCurPos.y - transformedPrevPos.y;

    setViewTransform((m) => m.translate(dx, dy));
    setPrevPos({ x: e.clientX, y: e.clientY });
  }

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    const scaleCenter = clientToG(
      svgRef.current!,
      viewTransform,
      e.clientX,
      e.clientY
    );
    const scaleFactor = 0.9;
    const delta = e.deltaY > 0 ? scaleFactor : 1 / scaleFactor;
    setViewTransform((m) =>
      m.scale(delta, delta, 1, scaleCenter.x, scaleCenter.y, 0)
    );
  }

  let radius = 5;
  if (svgRef.current!) {
    const origin = clientToG(svgRef.current!, viewTransform, 0, 0);
    const length = clientToG(svgRef.current!, viewTransform, 5, 0);
    radius = Math.sqrt(
      Math.pow(length.x - origin.x, 2) + Math.pow(length.y - origin.y, 2)
    );
  }

  return (
    <div className="App">
      <div>
        <button onClick={addPoint}>Add</button>
        <span>Click and drag to pan, mouse wheel to zoom</span>
      </div>
      <svg
        ref={svgRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      >
        <g transform={viewTransform.toString()}>
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={radius}
              strokeWidth={radius / 5}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default App;
