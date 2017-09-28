const data = (() => {
  const hash = rison.decode_object(decodeURI(window.location.hash.substring(1)));
  if (hash.updated > 0) { return hash; }

  const local = rison.decode_object(localStorage.getItem('saltpeanuts') || '');
  if (local.updated > 0) { return local; }

  return {
    updated: new Date(),
    blocks: [ 'study japanese', 'email', 'mozilla/nsf', 'click me!', 'elusive index 4' ],
    schedule: {
      monday: [1, 0, 0, 4],
      tuesday: [4, 4, 4, 4],
      wednesday: [],
      thursday: [],
      friday: [],
    },
    temp: {
      dragtext: null, // text of the block being dragged
      lastNotification: null, // last notification hour
      edit: {
        text: null, // text of the block being edited
        day: null, // day of the block being edited
        index: null, // index of the block being edited
        offset: null,   // offset to fix contenteditable caret
      },
    }
  };
})();

window.setInterval(function() {
  data.updated = new Date();
  const datastring = rison.encode_object(data);

  if (data.temp.currentDay) {
    if (data.temp.lastNotification === null ||
        data.temp.lastNotification !== [data.temp.currentDay, data.temp.currentBlock]) {
      data.temp.lastNotification = [data.temp.currentDay, data.temp.currentBlock];
      notify("new block!");
    }
  }

  localStorage.setItem('saltpeanuts', datastring);
  window.location.hash = datastring;
}, 2000 );

function notify(message) {
  if (Notification.permission === "granted") {
    var notification = new Notification(message);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission(function (permission) {
      if (permission === "granted") {
        var notification = new Notification(message);
      }
    });
  }
}

Vue.component('block', {
  props: ['labelIndex', 'blockIndex', 'dayName'],
  template: `<div v-bind:class="{ block: true, current: isCurrent }"
    contenteditable
    draggable
    :inner-text=label
    @blur=blur
    @input=edit
    @focus=editstart
    @keydown.enter=enter
    @dragstart=dragstart>{{label}}</div>`,
  computed: {
    label() {
      return data.blocks[this.labelIndex];
    },
    dayIndex() {
      const days = Object.keys(data.schedule);
      return days.findIndex(day => day === this.dayName);
    },
    isCurrent() {
      const currentDay = data.updated.getDay() - 1;
      const currentBlock = data.updated.getHours() - 10;

      return this.blockIndex === currentBlock &&
             this.dayIndex === currentDay;
    },
  },
  data: data,
  // horrid hack to move the cursor to the right place
  beforeUpdate() {
    const selection = window.getSelection();
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0);
      if (this.$el === range.startContainer.parentNode) {
        data.temp.edit.offset = range.startOffset;
        this.$nextTick(function() {
          if (range) {
            const range = window.getSelection().getRangeAt(0);
            range.setStart(this.$el.firstChild, data.temp.edit.offset);
          }
        });
      }
    } else {
      this.$nextTick(function() {
        if (data.temp.edit.index) {
          const day = document.getElementsByTagName('h1')[data.temp.edit.day + 1];
          const block = day.parentNode.children[data.temp.edit.index + 1];

          console.log('select', data.temp.edit.day, data.temp.edit.index);
          data.temp.edit.index = null;
          data.temp.edit.day = null;
          selection.selectAllChildren(block);
        }
      });
    }
  },
  methods: {
    editstart({target}) {
      data.temp.edit.text = target.textContent;
      data.temp.edit.day = this.dayIndex;
      data.temp.edit.index = Array.from(target.parentElement.children).findIndex(element => element === target) - 1;
    },
    edit({target}) {
      this.editing = true;
      data.blocks = data.blocks.map(function(block) {
        if (block == data.temp.edit.text) {
          return target.textContent;
        } else {
          return block;
        }
      });
      data.temp.edit.text = target.textContent;
    },
    blur() {
      data.temp.edit.text = null;
    },
    dragstart({target}) {
      data.temp.dragtext = target.textContent;
    },
    enter(event) {
      event.preventDefault();
      window.getSelection().removeAllRanges();
      data.blocks.push("");

      const parentElement = event.target.parentElement;
      const dayText = parentElement.firstChild.textContent.trim();
      const schedule = data.schedule[dayText];
      const before = schedule.slice(0, data.temp.edit.index);
      const after = schedule.slice(data.temp.edit.index);
      data.schedule[dayText] = before.concat([data.blocks.length - 1]).concat(after);

      console.log('select', data.temp.edit.day, data.temp.edit.index);
    },
  }
});
const app = new Vue({
  el: '#app',
  data: data,
  computed: {
    currentDay() {
      return data.updated.getDay() - 1;
    },
    currentBlock() {
      return data.updated.getHours() - 10;
    }
  },
  methods: {
    dblclick({target}) {
      const dayText = target.textContent.trim();
      data.schedule[dayText] = [];
    },
    drop({target, y}) {
      const blockText = data.temp.dragtext;
      const labelIndex = data.blocks.indexOf(blockText);
      const index = Array.from(target.children)
        .findIndex(element => element.offsetTop >= y) - 1;

      const dayText = target.firstChild.textContent.trim();
      const schedule = data.schedule[dayText];
      const before = schedule.slice(0, index);
      const after = schedule.slice(index);
      const sched = before.concat([labelIndex]).concat(after);

      data.schedule[dayText] = sched;
      data.temp.dragtext = null;
    }
  },
});
