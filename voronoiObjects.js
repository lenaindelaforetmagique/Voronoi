// Graph Objects
// Nodes
// Edges

pointList_to_string = function(points_) {
  let list = "";
  for (let point of points_) {
    list += (point.x) + ',' + (point.y) + ' ';
  }
  return list;
}

class Node {
  constructor(x_ = 0, y_ = 0, color, parent_) {
    this.pos = new Vector(x_, y_);
    this.contour = []; // list of points

    this.parent = parent_;

    this.dom = document.createElementNS(SVGNS, 'g');

    this.contourDom = document.createElementNS(SVGNS, 'polygon');
    this.contourDom.setAttribute('fill', color);
    this.dom.appendChild(this.contourDom);

    this.pointDom = document.createElementNS(SVGNS, 'ellipse');
    this.pointDom.setAttribute("class", "Node");
    this.pointDom.setAttribute('rx', 5);
    this.pointDom.setAttribute('ry', 5);
    this.dom.appendChild(this.pointDom);

    this.addEvents();
    this.reinit();
    this.updateDom();
  }

  reinit() {
    this.contour = this.parent.contour();
  }

  interact(other) {
    let newContour = [];

    let ptO = this.pos.copy();
    ptO.add(other.pos);
    ptO.div(2);

    let vectDir = other.pos.copy();
    vectDir.sub(this.pos);
    vectDir = new Vector(-vectDir.y, vectDir.x);
    let insertNewPoint = false;
    for (let i = 0; i < this.contour.length; i++) {
      let j = (i < this.contour.length - 1 ? i + 1 : 0);
      let vectOA = this.contour[i].copy();
      let vectOB = this.contour[j].copy();

      vectOA.sub(ptO);
      vectOB.sub(ptO);
      insertNewPoint = false;

      if (vectDir.crossProduct(vectOA) >= 0) {
        // on garde _i_
        newContour.push(this.contour[i]);
        if (vectDir.crossProduct(vectOB) < 0) {
          // inserer nouveau point
          insertNewPoint = true;
        }
      } else {
        // on ne garde pas _i_
        if (vectDir.crossProduct(vectOB) >= 0) {
          // insérer nouveau point
          insertNewPoint = true;
        }
      }

      if (insertNewPoint) {
        // Paul Bourke - Intersection point of two line segments in 2 dimensions

        let pt1 = this.contour[i].copy();
        let pt2 = this.contour[j].copy();
        let pt3 = ptO.copy();
        let pt4 = ptO.copy();
        pt4.add(vectDir);

        let x = 0;
        let y = 0;
        let ua = 0;

        ua = (pt4.x - pt3.x) * (pt1.y - pt3.y) - (pt4.y - pt3.y) * (pt1.x - pt3.x);
        ua /= (pt4.y - pt3.y) * (pt2.x - pt1.x) - (pt4.x - pt3.x) * (pt2.y - pt1.y);

        x = pt1.x + ua * (pt2.x - pt1.x);
        y = pt1.y + ua * (pt2.y - pt1.y);
        newContour.push(new Vector(x, y));

      }
    }
    this.contour = newContour;

  }



  updateDom() {
    this.pointDom.setAttribute('cx', this.pos.x);
    this.pointDom.setAttribute('cy', this.pos.y);
    this.contourDom.setAttributeNS(null, "points", pointList_to_string(this.contour));
  }

  addEvents() {
    var thiz = this;
    var handleDown = function(e) {
      e.preventDefault();
      thiz.parent.selectedNode = thiz;
    }
    this.pointDom.addEventListener("mousedown", handleDown, false);
    this.pointDom.addEventListener("touchstart", handleDown, false);
  }

}


class Edge {
  constructor(node1_, node2_) {
    this.nodes = [node1_, node2_];
    // this.node1 = node1_;
    // this.node2 = node2_;

    this.dom = document.createElementNS(SVGNS, 'polyline');
    this.statusOK = true;
    this.updateDom();
  }

  mayCross(other) {
    let vectAB = new Vector(0, 0);
    vectAB.add(this.nodes[1]);
    vectAB.sub(this.nodes[0]);

    let vectAC = new Vector(0, 0);
    vectAC.add(other.nodes[0]);
    vectAC.sub(this.nodes[0]);

    let vectAD = new Vector(0, 0);
    vectAD.add(other.nodes[1]);
    vectAD.sub(this.nodes[0]);

    return (vectAB.crossProduct(vectAC) * vectAB.crossProduct(vectAD) < 0);
  }

  controlOthers(listOfOthers) {
    this.statusOK = true;
    for (let other of listOfOthers) {
      if (this.mayCross(other) && other.mayCross(this)) {
        this.statusOK = false;
      }
    }
  }


  updateDom() {
    if (this.statusOK) {
      this.dom.setAttribute('class', 'segmentOK');
    } else {
      this.dom.setAttribute('class', 'segmentKO');
    }

    this.dom.setAttribute('points', pointList_to_string(this.nodes));
  }
}