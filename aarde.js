class AardeVM {
  constructor(memorySize) {
    this.currentIndex = 0;
    this.count = 0;

    this.memory = new Array(memorySize).fill(null).map(() => ({
      instruction: "_",
      energy: 10,
    }));

    this.draw();

    this.instructions = {
      S: this.start.bind(this),
      E: this.end.bind(this),
      F: this.find.bind(this),
      C: this.copy.bind(this),
      J: this.jump.bind(this),
    };

    this.register = {
      s: null,
      e: null,
      cs: null,
      ce: null,
      j: null,
    };

    this.requiredEnergy = 5;
  }

  draw() {
    let html = "";

    this.memory.forEach((cell, index) => {
      const instruction =
        cell.instruction === "_" ? "\u2591" : cell.instruction;
      const backgroundColor = `rgba(0, 255, 0, ${cell.energy / 10})`;
      const outline = index === this.currentIndex ? "2px solid red" : "none";
      const zIndex = index === this.currentIndex ? 1 : 0;
      html += `<span style="background-color: ${backgroundColor}; outline: ${outline}; z-index: ${zIndex}">${instruction}</span>`;
    });

    const memoryElement = document.getElementById("memory");
    memoryElement.innerHTML = html;
  }

  loadProgram(initialProgram) {
    initialProgram.forEach((instruction, index) => {
      this.memory[index].instruction = instruction;
    });
  }

  ticks(n) {
    for (let i = 0; i < n; i++) {
      this.tick();
    }
  }

  tick() {
    this.count++;

    const cell = this.memory[this.currentIndex];

    if (cell.instruction === "_") {
      // skip series of empty instructions
      for (let i = this.currentIndex + 1; i < this.memory.length; i++) {
        if (this.memory[i].instruction === "_") {
          this.currentIndex++;
        } else {
          this.currentIndex = i;
          break;
        }
      }
    }

    const instructionFn = this.instructions[cell.instruction];
    const energy = cell.energy;

    if (instructionFn) {
      if (energy >= this.requiredEnergy) {
        cell.energy -= this.requiredEnergy;
        this.currentIndex =
          instructionFn(this.currentIndex) ?? this.currentIndex + 1;
      } else {
        // Out of energy, reset the cell and move to the next
        cell.energy = 0;
        cell.instruction = "_";
        this.currentIndex++;
      }
    } else {
      this.currentIndex++;
    }

    if (this.currentIndex >= this.memory.length) {
      this.memory.forEach((cell) => {
        cell.energy = cell.energy + Math.random() * 8;
      });
      this.currentIndex = 0;
    }
  }

  jump(index) {
    if (
      this.register.j === null ||
      this.register.j >= this.memory.length ||
      this.memory[this.register.j].energy < 2 * this.requiredEnergy
    ) {
      return index + 1;
    }

    return this.register.j;
  }

  start(index) {
    const endIndex = this.memory
      .slice(index)
      .findIndex((cell) => cell.instruction === "E");

    this.register.s = index;
    this.register.e = endIndex !== -1 ? index + endIndex : null;
    this.register.cs = null;
    this.register.ce = null;
    this.register.j = index;
  }

  end(index) {
    this.register.s = null;
    this.register.e = null;
    this.register.cs = null;
    this.register.ce = null;
    this.register.j = null;
  }

  find() {
    if (this.register.s === null || this.register.e === null) {
      return;
    }

    const length = this.register.e - this.register.s;
    let startLocation = this.memory.findIndex(
      (cell) => cell.instruction === "_" && cell.energy >= this.requiredEnergy
    );

    if (startLocation === -1) {
      return;
    }

    let endLocation = startLocation + length;

    if (endLocation >= this.memory.length) {
      return;
    }

    this.register.cs = startLocation;
    this.register.ce = endLocation;
  }

  copy() {
    if (this.register.cs === null || this.register.ce === null) {
      return;
    }

    for (
      let i = this.register.s, j = this.register.cs;
      i <= this.register.e;
      i++, j++
    ) {
      this.memory[j].instruction = this.memory[i].instruction;
    }

    this.mutate();
  }

  mutate() {
    if (this.register.cs === null || this.register.ce === null) {
      return;
    }

    for (let i = this.register.cs; i <= this.register.ce; i++) {
      if (Math.random() < 0.1) {
        this.memory[i].instruction = this.getRandomInstruction();
      }
    }
  }

  getRandomInstruction() {
    const instructions = Object.keys(this.instructions);
    const mutated =
      instructions[Math.floor(Math.random() * instructions.length)];
    return mutated;
  }
}

const vm = new AardeVM(2_000);
const initialProgram = ["S", "F", "C", "J", "E"];
vm.loadProgram(initialProgram);

const speedElement = document.getElementById("speed");

document.getElementById("faster").addEventListener("click", () => {
  speedElement.textContent = Number(speedElement.textContent) * 2;
});

document.getElementById("slower").addEventListener("click", () => {
  speedElement.textContent = Math.max(1, Number(speedElement.textContent) / 2);
});

function runSimulation() {
  vm.ticks(Number(speedElement.textContent));
  vm.draw();
  requestAnimationFrame(runSimulation);
}

runSimulation();
