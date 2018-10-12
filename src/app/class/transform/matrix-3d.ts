import { CSSNumber } from './css-number';
import { IPoint2D, IPoint3D } from './transform';

export interface IMatrix3D {
  m11: number;
  m12: number;
  m13: number;
  m14: number;
  m21: number;
  m22: number;
  m23: number;
  m24: number;
  m31: number;
  m32: number;
  m33: number;
  m34: number;
  m41: number;
  m42: number;
  m43: number;
  m44: number;
}

export class Matrix3D {
  m11: number = 1;
  m12: number = 0;
  m13: number = 0;
  m14: number = 0;
  m21: number = 0;
  m22: number = 1;
  m23: number = 0;
  m24: number = 0;
  m31: number = 0;
  m32: number = 0;
  m33: number = 1;
  m34: number = 0;
  m41: number = 0;
  m42: number = 0;
  m43: number = 0;
  m44: number = 1;

  constructor() {
  }

  static create(element: HTMLElement, style: CSSStyleDeclaration = null, ret = new Matrix3D()): Matrix3D {
    if (element && element.ownerDocument)
      return ret.setCSS((style || window.getComputedStyle(element)).transform);
    return ret.identity();
  }

  setData(data: number[]): Matrix3D {
    if (data == null)
      return;

    let l = data.length;
    if (l == 16) {
      this.m11 = data[0];
      this.m12 = data[1];
      this.m13 = data[2];
      this.m14 = data[3];
      this.m21 = data[4];
      this.m22 = data[5];
      this.m23 = data[6];
      this.m24 = data[7];
      this.m31 = data[8];
      this.m32 = data[9];
      this.m33 = data[10];
      this.m34 = data[11];
      this.m41 = data[12];
      this.m42 = data[13];
      this.m43 = data[14];
      this.m44 = data[15];
    } else if (l == 6) {
      this.m11 = data[0];
      this.m12 = data[1];
      this.m13 = 0;
      this.m14 = 0;
      this.m21 = data[2];
      this.m22 = data[3];
      this.m23 = 0;
      this.m24 = 0;
      this.m31 = 0;
      this.m32 = 0;
      this.m33 = 1;
      this.m34 = 0;
      this.m41 = data[4];
      this.m42 = data[5];
      this.m43 = 0;
      this.m44 = 1;
    } else if (l == 9) {
      this.m11 = data[0];
      this.m12 = data[1];
      this.m13 = 0;
      this.m14 = data[2];
      this.m21 = data[3];
      this.m22 = data[4];
      this.m23 = 0;
      this.m24 = data[5];
      this.m31 = 0;
      this.m32 = 0;
      this.m33 = 1;
      this.m34 = 0;
      this.m41 = data[6];
      this.m42 = data[7];
      this.m43 = 0;
      this.m44 = data[8];
    }

    return this;
  }

  identity(): Matrix3D {
    this.m11 = 1;
    this.m12 = 0;
    this.m13 = 0;
    this.m14 = 0;
    this.m21 = 0;
    this.m22 = 1;
    this.m23 = 0;
    this.m24 = 0;
    this.m31 = 0;
    this.m32 = 0;
    this.m33 = 1;
    this.m34 = 0;
    this.m41 = 0;
    this.m42 = 0;
    this.m43 = 0;
    this.m44 = 1;
    return this;
  }

  scalar(scalar: number): Matrix3D {
    this.m11 *= scalar;
    this.m12 *= scalar;
    this.m13 *= scalar;
    this.m14 *= scalar;
    this.m21 *= scalar;
    this.m22 *= scalar;
    this.m23 *= scalar;
    this.m24 *= scalar;
    this.m31 *= scalar;
    this.m32 *= scalar;
    this.m33 *= scalar;
    this.m34 *= scalar;
    this.m41 *= scalar;
    this.m42 *= scalar;
    this.m43 *= scalar;
    this.m44 *= scalar;

    return this;
  }

  //based on http://code.metager.de/source/xref/mozilla/B2G/gecko/gfx/thebes/gfx3DMatrix.cpp#651
  unproject(point: IPoint2D, ret: IPoint3D = { x: 0, y: 0, z: 0, w: 1 }): IPoint3D {
    let x = point.x * this.m11 + point.y * this.m21 + this.m41;
    let y = point.x * this.m12 + point.y * this.m22 + this.m42;
    let z = point.x * this.m13 + point.y * this.m23 + this.m43;
    let w = point.x * this.m14 + point.y * this.m24 + this.m44;

    let qx = x + this.m31;
    let qy = y + this.m32;
    let qz = z + this.m33;
    let qw = w + this.m34;

    if (w == 0) w = 0.0001;
    x /= w;
    y /= w;
    z /= w;

    if (qw == 0) qw = 0.0001;
    qx /= qw;
    qy /= qw;
    qz /= qw;

    let wz = qz - z;
    if (wz == 0) {
      ret.x = x;
      ret.y = y;
      ret.z = z;
      ret.w = z;
      return ret;
    }

    let t = -z / wz;
    x += t * (qx - x);
    y += t * (qy - y);

    ret.x = x;
    ret.y = y;
    ret.z = z;
    ret.w = z;
    return ret;
  }

  project(point: IPoint3D, ret: IPoint3D = { x: 0, y: 0, z: 0, w: 1 }): IPoint3D {
    let z = point.z;
    let w = point.x * this.m14 + point.y * this.m24 + z * this.m34 + this.m44;
    let x = point.x * this.m11 + point.y * this.m21 + z * this.m31 + this.m41;
    let y = point.x * this.m12 + point.y * this.m22 + z * this.m32 + this.m42;

    if (w == 0) w = 0.0001;

    x /= w;
    y /= w;

    if (w < 0) {
      x -= this.m41;
      y -= this.m42;
      x *= 1 / w;
      y *= 1 / w;
      x += this.m41;
      y += this.m42;
    }

    ret.x = x;
    ret.y = y;
    ret.z = z;
    ret.w = z;
    return ret;
  }

  append(b: IMatrix3D): Matrix3D {
    return Matrix3D.multiply(this, b, this);
  }

  setPosition(position: IPoint3D): Matrix3D {
    this.m41 = position.x;
    this.m42 = position.y;
    this.m43 = position.z;
    return this;
  }

  getPosition(ret: IPoint3D = { x: 0, y: 0, z: 0, w: 1 }): IPoint3D {
    ret.x = this.m41;
    ret.y = this.m42;
    ret.z = this.m43;
    return ret;
  }
  static makePosition(position: IPoint3D, ret = new Matrix3D()): Matrix3D {
    ret.identity();
    ret.setPosition(position);
    return ret;
  }

  appendPosition(position: IPoint3D): Matrix3D
  appendPosition(x: number, y: number, z: number): Matrix3D
  appendPosition(...args: any[]): Matrix3D {
    let position;
    if (args.length === 1) {
      position = args[0];
    } else {
      position = { x: args[0], y: args[1], z: args[2], w: 1 };
    }
    return this.append(Matrix3D.makePosition(position, Matrix3D.MATRIX3D));
  }

  static makePerspective(perspective: number, ret = new Matrix3D()): Matrix3D {
    ret.identity();
    ret.m34 = perspective ? -(1 / perspective) : 0;
    return ret;
  }

  appendPerspective(perspective: number): Matrix3D {
    if (!perspective)
      return this;
    return this.append(Matrix3D.makePerspective(perspective, Matrix3D.MATRIX3D));
  }

  /**
  * Inverts the matrix.
  * -> based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
  * -> based on https://github.com/mrdoob/three.js/blob/master/src/math/Matrix4.js
  */
  invert(target?: Matrix3D): Matrix3D {
    target = target || this;
    let data: number[] = [];

    let n11 = this.m11, n12 = this.m12, n13 = this.m13, n14 = this.m14;
    let n21 = this.m21, n22 = this.m22, n23 = this.m23, n24 = this.m24;
    let n31 = this.m31, n32 = this.m32, n33 = this.m33, n34 = this.m34;
    let n41 = this.m41, n42 = this.m42, n43 = this.m43, n44 = this.m44;

    data[0] = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
    data[1] = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
    data[2] = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
    data[3] = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

    let det = n11 * data[0] + n21 * data[1] + n31 * data[2] + n41 * data[3];
    if (det == 0) {
      console.warn('Can not invert matrix, determinant is 0');
      return this;
    }

    data[4] = n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44;
    data[5] = n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44;
    data[6] = n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44;
    data[7] = n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34;
    data[8] = n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44;
    data[9] = n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44;
    data[10] = n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44;
    data[11] = n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34;
    data[12] = n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43;
    data[13] = n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43;
    data[14] = n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43;
    data[15] = n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33;

    target.setData(data);
    target.scalar(1 / det);
    return target;
  }

  setCSS(cssString: string): Matrix3D {
    if (!cssString || cssString == 'none') return this.identity();
    let trans: any = cssString.replace('matrix3d(', '').replace('matrix(', '').replace(')', '').split(',');
    let l = trans.length;
    for (let i = 0; i < l; ++i) {
      trans[i] = CSSNumber.parse(trans[i]);
    }
    return this.setData(trans);
  }

  appendCSS(cssString: string, force2D: boolean = false): Matrix3D {
    if (!cssString || cssString == 'none') return this;
    if (force2D && cssString.indexOf('matrix3d') >= 0) {
      return this.append(Matrix3D.MATRIX3D.setCSS(cssString).flatten());
    }
    return this.append(Matrix3D.MATRIX3D.setCSS(cssString));
  }

  flatten(): Matrix3D {
    this.m31 = 0;
    this.m32 = 0;
    this.m33 = 1;
    this.m34 = 0;
    this.m44 = 1;
    this.m14 = 0;
    this.m24 = 0;
    this.m43 = 0;
    return this;
  }

  static multiply(a: IMatrix3D, b: IMatrix3D, ret: Matrix3D = new Matrix3D()): Matrix3D {
    let m11 = a.m11 * b.m11 + a.m12 * b.m21 + a.m13 * b.m31 + a.m14 * b.m41;
    let m12 = a.m11 * b.m12 + a.m12 * b.m22 + a.m13 * b.m32 + a.m14 * b.m42;
    let m13 = a.m11 * b.m13 + a.m12 * b.m23 + a.m13 * b.m33 + a.m14 * b.m43;
    let m14 = a.m11 * b.m14 + a.m12 * b.m24 + a.m13 * b.m34 + a.m14 * b.m44;
    let m21 = a.m21 * b.m11 + a.m22 * b.m21 + a.m23 * b.m31 + a.m24 * b.m41;
    let m22 = a.m21 * b.m12 + a.m22 * b.m22 + a.m23 * b.m32 + a.m24 * b.m42;
    let m23 = a.m21 * b.m13 + a.m22 * b.m23 + a.m23 * b.m33 + a.m24 * b.m43;
    let m24 = a.m21 * b.m14 + a.m22 * b.m24 + a.m23 * b.m34 + a.m24 * b.m44;
    let m31 = a.m31 * b.m11 + a.m32 * b.m21 + a.m33 * b.m31 + a.m34 * b.m41;
    let m32 = a.m31 * b.m12 + a.m32 * b.m22 + a.m33 * b.m32 + a.m34 * b.m42;
    let m33 = a.m31 * b.m13 + a.m32 * b.m23 + a.m33 * b.m33 + a.m34 * b.m43;
    let m34 = a.m31 * b.m14 + a.m32 * b.m24 + a.m33 * b.m34 + a.m34 * b.m44;
    let m41 = a.m41 * b.m11 + a.m42 * b.m21 + a.m43 * b.m31 + a.m44 * b.m41;
    let m42 = a.m41 * b.m12 + a.m42 * b.m22 + a.m43 * b.m32 + a.m44 * b.m42;
    let m43 = a.m41 * b.m13 + a.m42 * b.m23 + a.m43 * b.m33 + a.m44 * b.m43;
    let m44 = a.m41 * b.m14 + a.m42 * b.m24 + a.m43 * b.m34 + a.m44 * b.m44;

    ret.m11 = m11;
    ret.m12 = m12;
    ret.m13 = m13;
    ret.m14 = m14;
    ret.m21 = m21;
    ret.m22 = m22;
    ret.m23 = m23;
    ret.m24 = m24;
    ret.m31 = m31;
    ret.m32 = m32;
    ret.m33 = m33;
    ret.m34 = m34;
    ret.m41 = m41;
    ret.m42 = m42;
    ret.m43 = m43;
    ret.m44 = m44;

    return ret;
  }

  public toString(fractionalDigits: number = 3): string {
    return "m11=" + this.m11.toFixed(fractionalDigits)
      + "\tm21=" + this.m21.toFixed(fractionalDigits)
      + "\tm31=" + this.m31.toFixed(fractionalDigits)
      + "\tm41=" + this.m41.toFixed(fractionalDigits)
      + "\nm12=" + this.m12.toFixed(fractionalDigits)
      + "\tm22=" + this.m22.toFixed(fractionalDigits)
      + "\tm32=" + this.m32.toFixed(fractionalDigits)
      + "\tm42=" + this.m42.toFixed(fractionalDigits)
      + "\nm13=" + this.m13.toFixed(fractionalDigits)
      + "\tm23=" + this.m23.toFixed(fractionalDigits)
      + "\tm33=" + this.m33.toFixed(fractionalDigits)
      + "\tm43=" + this.m43.toFixed(fractionalDigits)
      + "\nm14=" + this.m14.toFixed(fractionalDigits)
      + "\tm24=" + this.m24.toFixed(fractionalDigits)
      + "\tm34=" + this.m34.toFixed(fractionalDigits)
      + "\tm44=" + this.m44.toFixed(fractionalDigits);
  }
  private static MATRIX3D = new Matrix3D();
}