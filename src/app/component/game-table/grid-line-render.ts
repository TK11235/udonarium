import { GridType } from '@udonarium/game-table';

type StrokeGridFunc = (w: number, h: number, gridSize: number) => GridPosition;
type GridPosition = { gx: number, gy: number };

export class GridLineRender {
  constructor(readonly canvasElement: HTMLCanvasElement) {
  }

  private makeBrush(context: CanvasRenderingContext2D, gridSize: number, gridColor: string): CanvasRenderingContext2D {
    // 座標描画用brush設定
    context.strokeStyle = gridColor;
    context.fillStyle = context.strokeStyle;
    context.lineWidth = 1;

    let fontSize: number = Math.floor(gridSize / 5);
    context.font = `bold ${fontSize}px sans-serif`;
    context.textBaseline = 'top';
    context.textAlign = 'center';
    return context
  }

  render(width: number, height: number, gridSize: number = 50, gridType: GridType = GridType.SQUARE, gridColor: string = '#000000e6') {
    this.canvasElement.width = width * gridSize;
    this.canvasElement.height = height * gridSize;
    let context: CanvasRenderingContext2D = this.canvasElement.getContext('2d');

    if (gridType < 0) return;

    let calcGridPosition: StrokeGridFunc = this.generateCalcGridPositionFunc(gridType);
    this.makeBrush(context, gridSize, gridColor);
    for (let h = 0; h <= height; h++) {
      for (let w = 0; w <= width; w++) {
        let { gx, gy } = calcGridPosition(w, h, gridSize);
        this.strokeSquare(context, gx, gy, gridSize);
        context.fillText((w + 1).toString() + '-' + (h + 1).toString(), gx + (gridSize / 2), gy + (gridSize / 2));
      }
    }
  }

  private generateCalcGridPositionFunc(gridType: GridType): StrokeGridFunc {
    switch (gridType) {
      case GridType.HEX_VERTICAL: // ヘクス縦揃え
        return (w, h, gridSize) => {
          if ((w % 2) === 1) {
            return { gx: w * gridSize, gy: h * gridSize };
          } else {
            return { gx: w * gridSize, gy: h * gridSize + (gridSize / 2) };
          }
        }

      case GridType.HEX_HORIZONTAL: // ヘクス横揃え(どどんとふ互換)
        return (w, h, gridSize) => {
          if ((h % 2) === 1) {
            return { gx: w * gridSize, gy: h * gridSize };
          } else {
            return { gx: w * gridSize + (gridSize / 2), gy: h * gridSize };
          }
        }

      default: // スクエア(default)
        return (w, h, gridSize) => {
          return { gx: w * gridSize, gy: h * gridSize };
        }
    }
  }

  private strokeSquare(context: CanvasRenderingContext2D, gx: number, gy: number, gridSize: number) {
    context.beginPath();
    context.strokeRect(gx, gy, gridSize, gridSize);
  }

  private strokeHex(context: CanvasRenderingContext2D, gx: number, gy: number, gridSize: number, gridType: GridType) {
    let deg = gridType === GridType.HEX_HORIZONTAL ? -30 : 0;
    let radius = gridSize / Math.sqrt(3);
    let cx = gx + gridSize / 2;
    let cy = gy + gridSize / 2;

    context.beginPath();
    for (let i = 0; i < 6; i++) {
      deg += 60;
      let radian = Math.PI / 180 * deg;
      let x = Math.cos(radian) * radius + cx;
      let y = Math.sin(radian) * radius + cy;
      context.lineTo(x, y);
    }
    context.closePath();
    context.stroke();
  }
}
