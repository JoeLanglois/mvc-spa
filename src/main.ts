import './style.css';

import { html, render } from 'uhtml';

type ListViewProps = {
  onToggleTask: (taskUid: string) => void;
};

type ListViewData = {
  name: string;
  tasks: Array<Task>;
};

class ListView {
  constructor(private props: ListViewProps = { onToggleTask: () => {} }) {}

  render(data: ListViewData) {
    return html`
      <h2>${data.name}</h2>

      <div>
        ${
          data.tasks.length === 0
            ? html`<div>No task so far, <span>add one?</span></div>`
            : null
        }
        
        ${data.tasks.map(
          (task) => html`<div>
          <button @click=${() => {
            this.props.onToggleTask(task.uid);
          }}>${task.done ? 'X' : 'O'}</button>
          ${task.name}
        </div>`
        )}
      </div>
    `;
  }
}

type AsideProps = {
  onListClick: (listUid: string) => void;
};

class AsideView {
  constructor(private props: AsideProps) {}

  render(data: {
    lists: Array<{
      uid: string;
      name: string;
      todosCount: number;
      selected: boolean;
    }>;
  }) {
    return html`
      <p>Listes</p>
      <nav>
        ${data.lists.map(
          (list) =>
            html`<p @click=${() => this.props.onListClick(list.uid)}>
                ${list.selected ? '- ' : ''}${list.name} <span>${
              list.todosCount > 0 ? list.todosCount : ''
            }</span></p>`
        )}
      </nav>
    `;
  }
}

class ListsController {
  private app: Application;
  asideView: AsideView;
  listView: ListView;

  selectedListUid: string | null;

  constructor(app: Application) {
    this.selectedListUid = null;

    this.app = app;

    this.asideView = new AsideView({
      onListClick: (listUid: string) => {
        this.load(listUid);
      },
    });

    this.listView = new ListView({
      onToggleTask: (taskUid: string) => {
        this.app.lists.toggleTask(this.selectedListUid!, taskUid);
        this.rerender();
      },
    });
  }

  load(listUid: string) {
    this.selectedListUid = listUid;

    this.app.root.innerHTML = `
      <header>
        Tâches
      </header>

      <div id="wrapper">
        <aside></aside>
        <main></main>
      </div>
    `;

    this.rerender();
  }

  rerender() {
    // Get the list from the application
    const listData = this.app.lists.get(this.selectedListUid!);

    this.renderAside();
    this.renderListView(listData);
  }

  renderAside() {
    const listsData = this.app.lists.all().map((listData) => {
      return {
        ...listData,
        todosCount: listData.tasks.filter((t) => !t.done).length,
        selected: listData.uid === this.selectedListUid,
      };
    });

    render(
      this.app.root.querySelector('aside')!,
      this.asideView.render({ lists: listsData })
    );
  }

  renderListView(list: TaskList) {
    render(
      this.app.root.querySelector('main')!,
      this.listView.render({
        name: list.name,
        tasks: list.tasks,
      })
    );
  }
}

type Task = {
  uid: string;
  name: string;
  done: boolean;
};

type TaskList = {
  uid: string;
  name: string;
  tasks: Array<Task>;
};

class TaskListsRepo {
  private lists: Record<string, TaskList>;

  constructor() {
    this.lists = {
      inbox: {
        uid: 'inbox',
        name: 'Inbox',
        tasks: [{ uid: 'a', name: 'Do something', done: false }],
      },
      other: { uid: 'other', name: 'Other', tasks: [] },
      waiting: { uid: 'waiting', name: 'Waiting', tasks: [] },
    };
  }

  get(uid: string) {
    return this.lists[uid] || null;
  }

  all() {
    return Object.values(this.lists);
  }

  toggleTask(listUid: string, taskUid: string) {
    const t = this.lists[listUid].tasks.find((t) => t.uid === taskUid);
    if (!t) return;

    t.done = !t.done;
  }
}

class Application {
  root: HTMLElement;
  currentController: Controller | null;

  lists: TaskListsRepo;

  constructor() {
    this.root = document.getElementById('app')!;
    this.currentController = null;

    this.lists = new TaskListsRepo();
  }

  load() {
    this.currentController = new ListsController(this);
    this.currentController.load('inbox');
  }
}

const app = new Application();
app.load();
