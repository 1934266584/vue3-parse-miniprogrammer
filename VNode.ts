// 这个地方是微信的setState方法
function setState(params: {
  node: VNode,
  data: string | Array<any> | RawNode,
  key?: string
}) {
  console.log(params)
}

export const enum TYPE {
  RAWTEXT = 'text'
}

export const generate = function() {
  return Date.now()
}

interface RawNode {
  type: string,
  text: string,
  id?: number,
  props?: Record<string, any>;
  children?: RawNode[];
}

export class VNode {
  id: number;
  type: string;
  props?: Record<string, any>;
  text?: string;
  children: VNode[] = [];
  eventListeners?: Record<string, Function | Function[]> | null;
  parentNode?: VNode | null;
  nextSibling?: VNode | null;
  
  constructor({
    id,
    type,
    props = {},
    text,
  }: {
    id: number,
    type: string,
    props?: Record<string, any>,
    text?: string,
  }) {
    this.type = type;
    this.props = props;
    this.text = text;
    this.id = id;
  }

  appendChild(newNode: VNode) {
    if (this.children.find(child => child.id === newNode.id)) {
      this.removeChild(newNode)
    }
    newNode.parentNode = this;
    this.children.push(newNode);
    // 调用小程序的setState
    setState({ node: newNode, data: newNode.toJSON() });
  }

  insertBefore(newNode: VNode, anchor: VNode) {
    newNode.parentNode = this;
    newNode.nextSibling = anchor;
    if (this.children.find(child => child.id === newNode.id)) {
      this.removeChild(newNode)
    }
    const anchorIndex = this.children.indexOf(anchor);
    this.children.splice(anchorIndex, 0, newNode);
    setState({
      node: this,
      key: '.children',
      data: this.children.map((c) => c.toJSON()),
    }); // 调用了小程序的 setData
  }

  removeChild(child: VNode) {
    const index = this.children.findIndex(node => node.id === child.id);
    if (index < 0 ) {
      return;
    }

    if (index === 0) {
      this.children = [];
    } else {
      this.children[index - 1].nextSibling = this.children[index + 1];
      this.children.splice(index, 1);
    }
    setState({
      node: this,
      key: '.children',
      data: this.children.map((c) => c.toJSON()),
    }); // 调用了小程序的 setData
  }

  setText(text: string) {
    if (this.type === TYPE.RAWTEXT) {
      this.text = text;
      setState({ node: this, key: '.text', data: text });
      return;
    }

    if (!this.children.length) {
      this.appendChild(
        new VNode({
          type: TYPE.RAWTEXT,
          id: generate(),
          text,
        })
      )
    }

    this.children[0].text = text;
    setState({ node: this, key: '.children[0].text', data: text });
  }

  path(): string {
    if (!this.parentNode) {
      return 'root';
    }
    const path = this.parentNode.path();
    return [
      ...(path === 'root' ? ['root'] : path),
      '.children[',
      this.parentNode.children.indexOf(this) + ']',
    ].join('');
  }

  toJSON(): RawNode {
    if (this.type === TYPE.RAWTEXT) {
      return {
        type: this.type,
        text: this.text,
      }
    }
    return {
      id: this.id,
      type: this.type,
      props: this.props,
      children: this.children && this.children.map(c => c.toJSON()),
      text: this.text,
    }
  }
}
