
class Test1 {
  constructor(id) {
    this.dom = document.getElementById(id);
    console.log(this.dom.style)
  }

  start() {
    this.dom.addEventListener('click', ()=>{
      let color = '#'+('00000'+(Math.random()*0x1000000<<0).toString(16)).slice(-6);
      console.log(color);
      this.dom.style.backgroundColor = color;
    });
  }
}

export {Test1}