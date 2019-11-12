SVGNS = "http://www.w3.org/2000/svg";

if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
};

colorGenerator = function(r = 0, g = 0, b = 0, alpha = 1) {
  return `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha})`;
}


class Universe {
  constructor() {
    this.container = document.getElementById("container");
    this.dom = document.createElementNS(SVGNS, "svg");
    this.container.appendChild(this.dom);
    this.viewBox = new ViewBox(this.dom);

    // this.legend = document.getElementById("legend");
    this.header = document.getElementById("header");
    this.footer = document.getElementById("footer");
    this.overlay = document.getElementById("overlay");

    this.selectedNode = null;
    this.nodes = [];

    this.init();
    this.addEvents();
    // 
    // let nb = 50;
    // let dx = Math.PI * 2 / nb;
    // let r_ = 300;
    //
    // for (let i = 0; i < nb; i++) {
    //
    //   let r2 = r_ + r_ * Math.cos(i) / 30;
    //   this.addNewNode(r2 * Math.cos(i * dx), r2 * Math.sin(i * dx));
    //
    // }
    this.updateDom();

  }

  contour() {
    return this.viewBox.contour;
  }

  init() {
    // clean everything
    while (this.dom.firstChild != null) {
      this.dom.removeChild(this.dom.firstChild);
    }

    this.edgesDom = document.createElementNS(SVGNS, 'g');
    this.dom.appendChild(this.edgesDom);

    this.nodesDom = document.createElementNS(SVGNS, 'g');
    this.dom.appendChild(this.nodesDom);

    this.nodes = [];
    this.selectedNode = null;
    this.updateDom();
  }

  refresh() {
    let now = Date.now();
    if (now - this.lastUpdate > 20) {
      this.lastUpdate = now;
      this.recalPos();
      this.updateDom();
    }
  }

  addNewNode(x_ = 0, y_ = 0) {
    let color = colorGenerator(Math.random() * 255, Math.random() * 255, Math.random() * 255, 0.9);
    let newNode = new Node(x_, y_, color, this);
    this.nodesDom.appendChild(newNode.dom);
    this.nodes.push(newNode)
  }

  updateDom() {
    for (let node of this.nodes) {
      node.reinit();
      for (let other of this.nodes) {
        if (node != other) {
          node.interact(other);
        }
      }
      node.updateDom();
    }
  }


  addEvents() {
    let thiz = this;

    // KEYBOARD Events
    document.onkeydown = function(e) {
      // console.log(e.key);
      switch (e.key.toUpperCase()) {
        // case "ENTER":
        //   thiz.addCurve();
        //   break;
        case ' ':
          thiz.init();
          break;
          // case "ARROWUP":
          //   thiz.levelUp();
          //   break;
          // case "ARROWDOWN":
          //   thiz.levelDown();
          //   break;
        default:
          break;
      }
    }


    var handleDown = function(e) {
      e.preventDefault();
      if (!thiz.selectedNode) {
        thiz.addNewNode(
          thiz.viewBox.realX(e.clientX),
          thiz.viewBox.realY(e.clientY)
        );
        thiz.updateDom();
      }
    }

    var handleMove = function(e) {
      e.preventDefault();
      if (thiz.selectedNode != null) {
        thiz.selectedNode.pos.x = thiz.viewBox.realX(e.clientX);
        thiz.selectedNode.pos.y = thiz.viewBox.realY(e.clientY);
        thiz.updateDom();
      }
    }

    var handleUp = function(e) {
      e.preventDefault();
      thiz.selectedNode = null;
      thiz.updateDom();
    }

    // MOUSE events
    this.container.addEventListener("mousedown", handleDown, false);
    document.addEventListener("mousemove", handleMove, false);
    document.addEventListener("mouseup", handleUp, false);

    document.addEventListener("wheel", function(e) {
      e.preventDefault();
      let k = 1.1;
      if (e.deltaY > 0) {
        k = 1 / k;
      }
      thiz.viewBox.scale(e.clientX, e.clientY, k);
      thiz.updateDom();
    }, false);

    // TOUCH events
    document.addEventListener("touchstart", function(e) {

      e.preventDefault();
      if (!thiz.selectedNode) {
        thiz.addNewNode(
          thiz.viewBox.realX(e.changedTouches[0].clientX),
          thiz.viewBox.realY(e.changedTouches[0].clientY)
        );
        thiz.updateDom();
      }
    }, false);

    // document.addEventListener("touchmove", handleMove, false);

    this.container.addEventListener("touchmove", function(e) {
      e.preventDefault();
      if (thiz.selectedNode != null) {
        thiz.selectedNode.pos.x = thiz.viewBox.realX(e.changedTouches[0].clientX);
        thiz.selectedNode.pos.y = thiz.viewBox.realY(e.changedTouches[0].clientY);
        thiz.updateDom();
      }
    }, false);


    this.container.addEventListener("touchend", handleUp, false);

    this.container.addEventListener("touchcancel", function(e) {
      e.preventDefault();
    }, false);

    this.container.addEventListener("touchleave", function(e) {
      e.preventDefault();
    }, false);


    // DOM OBJETS CLICK
    // this.ub.onclick = function() {
    //   thiz.levelUp();
    // };
    //
    // this.db.onclick = function() {
    //   thiz.levelDown();
    // };
    //
    // this.overlay.onclick = function() {
    //   thiz.levelUp();
    // }


    // OTHER events
    window.onresize = function(e) {
      thiz.viewBox.resize();
      thiz.updateDom();
    }


    // window.onerror = function(msg, source, noligne, nocolonne, erreur) {
    //   let str = "";
    //   str += msg;
    //   str += " * ";
    //   str += source;
    //   str += " * ";
    //   str += noligne;
    //   str += " * ";
    //   str += nocolonne;
    //   str += " * ";
    //   // str += erreur;
    //   thiz.console(str);
    // }
  }

}

class ViewBox {
  constructor(parent_) {
    this.parent = parent_;
    this.xMin = 0;
    this.yMin = 0;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.contour = [];
    this.set();
  }

  repr() {
    return this.xMin + " " + this.yMin + " " + this.width + " " + this.height;
  }

  set() {
    let dx = 0;
    let dy = 0;
    this.contour = [];
    this.contour.push(new Vector(this.xMin + dx, this.yMin + dy));
    this.contour.push(new Vector(this.xMin - dx + this.width, this.yMin + dy));
    this.contour.push(new Vector(this.xMin - dx + this.width, this.yMin + this.height - dy));
    this.contour.push(new Vector(this.xMin + dx, this.yMin + this.height - dy));
    this.parent.setAttributeNS(null, 'viewBox', this.repr());
  }

  realX(x) {
    // Returns the "real" X in the viewBox from a click on the parent Dom...
    let domRect = this.parent.getBoundingClientRect();
    return (x - domRect.left) / domRect.width * this.width + this.xMin;
  }

  realY(y) {
    // Returns the "real" Y in the viewBox from a click on the parent Dom...
    let domRect = this.parent.getBoundingClientRect();
    return (y - domRect.top) / domRect.height * this.height + this.yMin;
  }

  // Events
  resize() {
    this.height = this.width * window.innerHeight / window.innerWidth;
    this.set();
  }

  scale(x, y, fact = 1) {
    let coorX = this.realX(x);
    let coorY = this.realY(y);

    this.xMin = coorX - (coorX - this.xMin) / fact;
    this.yMin = coorY - (coorY - this.yMin) / fact;
    this.width /= fact;
    this.height /= fact;
    this.set();
  }

  translate(dx, dy) {
    let domRect = this.parent.getBoundingClientRect();
    this.xMin += dx / domRect.width * this.width;
    this.yMin += dy / domRect.height * this.height;
    this.set();
  }
}

let u_ = new Universe();
//
// var updateCB = function(timestamp) {
//   u_.refresh(timestamp);
//   window.requestAnimationFrame(updateCB);
// };
// updateCB(0);