import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import { NeuralTree } from './tree.component';
import {
  NeuralTreeEmptyTemplate,
  NeuralTreeIconTemplate,
  NeuralTreeLoadingTemplate,
  NeuralTreeNodeTemplate,
  NeuralTreeTogglerTemplate,
} from './tree-templates';
import type {
  NeuralTreeLazyLoadEvent,
  NeuralTreeNode,
  NeuralTreeNodeEvent,
} from './tree.types';

@Component({
  imports: [NeuralTree],
  template: `
    <neural-tree
      [(expandedKeys)]="expanded"
      [value]="nodes()"
      [loading]="loading()"
      [(filterValue)]="filter"
      [filterMode]="filterMode()"
      [unstyled]="unstyled()"
      [selectionMode]="selectionMode()"
      [(selectionKeys)]="selection"
      [metaKeySelection]="metaKeySelection()"
      [classes]="{ label: 'consumer-label' }"
      (nodeToggle)="toggles.push($event)"
      (lazyLoad)="lazyEvents.push($event)"
      (nodeSelect)="selectEvents.push($event)"
    />
  `,
})
class HostComponent {
  readonly tree = viewChild.required(NeuralTree);
  readonly expanded = signal<ReadonlySet<string | number>>(new Set());
  readonly nodes = signal<readonly NeuralTreeNode[]>([
    {
      key: 'workspace',
      label: 'Workspace',
      iconClass: 'nt-folders',
      children: [
        { key: 'readme', label: 'README', iconClass: 'nt-file-text' },
        { key: 'notes', label: 'Notes', iconClass: 'nt-file-text' },
      ],
    },
    { key: 'remote', label: 'Remote', leaf: false },
    { key: 'disabled', label: 'Disabled', leaf: false, disabled: true },
  ]);
  readonly loading = signal(false);
  readonly filter = signal('');
  readonly filterMode = signal<'lenient' | 'strict'>('lenient');
  readonly unstyled = signal(false);
  readonly selectionMode = signal<'single' | 'multiple' | 'checkbox' | null>(
    null,
  );
  readonly selection = signal<ReadonlySet<string | number>>(new Set());
  readonly metaKeySelection = signal(true);
  readonly toggles: NeuralTreeNodeEvent[] = [];
  readonly lazyEvents: NeuralTreeLazyLoadEvent[] = [];
  readonly selectEvents: Array<{ key: string | number; selected: boolean }> =
    [];
}

@Component({
  imports: [
    NeuralTree,
    NeuralTreeEmptyTemplate,
    NeuralTreeIconTemplate,
    NeuralTreeLoadingTemplate,
    NeuralTreeNodeTemplate,
    NeuralTreeTogglerTemplate,
  ],
  template: `
    <neural-tree [value]="nodes()" [loading]="loading()">
      <ng-template neuralTreeNode let-node let-selected="selected">
        <span class="custom-node">{{ node.label }}:{{ selected }}</span>
      </ng-template>
      <ng-template neuralTreeToggler let-expanded="expanded">
        <span class="custom-toggler">{{ expanded ? '-' : '+' }}</span>
      </ng-template>
      <ng-template neuralTreeIcon let-iconClass="iconClass">
        <span class="custom-icon">{{ iconClass }}</span>
      </ng-template>
      <ng-template neuralTreeLoading let-label>
        <span class="custom-loading">{{ label }}</span>
      </ng-template>
      <ng-template neuralTreeEmpty let-label>
        <span class="custom-empty">{{ label }}</span>
      </ng-template>
    </neural-tree>
  `,
})
class TemplateHostComponent {
  readonly nodes = signal<readonly NeuralTreeNode[]>([
    {
      key: 'custom',
      label: 'Custom',
      iconClass: 'nt-sparkles',
      children: [{ key: 'child', label: 'Child' }],
    },
  ]);
  readonly loading = signal(false);
}

describe('NeuralTree beta', () => {
  it('renders flat tree semantics and toggles controlled expansion', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const tree = fixture.nativeElement.querySelector(
      '[role="tree"]',
    ) as HTMLElement;
    expect(tree.getAttribute('aria-label')).toBe('Tree');
    expect(
      fixture.nativeElement.querySelectorAll('[role="treeitem"]'),
    ).toHaveLength(3);

    (
      fixture.nativeElement.querySelector(
        '[data-key="workspace"] button',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded().has('workspace')).toBe(true);
    expect(
      fixture.nativeElement.querySelectorAll('[role="treeitem"]'),
    ).toHaveLength(5);
    expect(
      fixture.nativeElement.querySelector(
        '[data-key="workspace"] > [role="group"]',
      ),
    ).not.toBeNull();
    expect(
      fixture.componentInstance.toggles[
        fixture.componentInstance.toggles.length - 1
      ],
    ).toMatchObject({
      key: 'workspace',
      expanded: true,
    });
  });

  it('emits one lazy request and blocks disabled branches', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const remote = fixture.nativeElement.querySelector(
      '[data-key="remote"] button',
    ) as HTMLButtonElement;
    remote.click();
    fixture.detectChanges();
    remote.click();
    fixture.detectChanges();
    remote.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lazyEvents).toHaveLength(1);
    expect(fixture.componentInstance.lazyEvents[0].path).toEqual(['remote']);
    const disabled = fixture.nativeElement.querySelector(
      '[data-key="disabled"] button',
    ) as HTMLButtonElement;
    expect(disabled.disabled).toBe(true);
  });

  it('supports expand/collapse all, loading, and unstyled structural hooks', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    fixture.componentInstance.tree().expandAll();
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded()).toEqual(
      new Set(['workspace', 'remote', 'disabled']),
    );
    const label = fixture.nativeElement.querySelector(
      '.neural-tree-label-root',
    ) as HTMLElement;
    expect(label.classList).toContain('consumer-label');
    expect(label.classList).not.toContain('neural-tree-label-base');
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="status"]').textContent,
    ).toContain('Loading tree');
    fixture.componentInstance.tree().collapseAll();
    expect(fixture.componentInstance.expanded().size).toBe(0);
  });

  it('honors global unstyled configuration', () => {
    TestBed.overrideProvider(NEURAL_NG_CONFIG, {
      useValue: {
        unstyled: true,
        direction: 'auto',
        density: 'comfortable',
      },
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.neural-tree-root');
    expect(root.classList).not.toContain('neural-tree-root-base');
    expect(root.querySelector('[role="treeitem"]')).not.toBeNull();
  });

  it('supports single and modifier-aware multiple selection', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.selectionMode.set('single');
    fixture.componentInstance.expanded.set(new Set(['workspace']));
    fixture.detectChanges();
    selectRow(fixture, 'workspace');
    expect(fixture.componentInstance.selection()).toEqual(
      new Set(['workspace']),
    );
    selectRow(fixture, 'remote');
    expect(fixture.componentInstance.selection()).toEqual(new Set(['remote']));

    fixture.componentInstance.selectionMode.set('multiple');
    fixture.componentInstance.selection.set(new Set());
    fixture.detectChanges();
    selectRow(fixture, 'workspace');
    selectRow(fixture, 'readme', { ctrlKey: true });
    expect(fixture.componentInstance.selection()).toEqual(
      new Set(['workspace', 'readme']),
    );
    selectRow(fixture, 'remote', { shiftKey: true });
    expect(fixture.componentInstance.selection()).toEqual(
      new Set(['readme', 'notes', 'remote']),
    );
  });

  it('propagates checkbox selection down and partial/full state up', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.selectionMode.set('checkbox');
    fixture.componentInstance.expanded.set(new Set(['workspace']));
    fixture.detectChanges();
    selectRow(fixture, 'readme');
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('[data-key="workspace"]')
        .getAttribute('aria-checked'),
    ).toBe('mixed');
    expect(fixture.componentInstance.selection()).toEqual(new Set(['readme']));
    selectRow(fixture, 'notes');
    expect(fixture.componentInstance.selection()).toEqual(
      new Set(['readme', 'notes', 'workspace']),
    );
    selectRow(fixture, 'workspace');
    expect(fixture.componentInstance.selection().has('readme')).toBe(false);
    expect(fixture.componentInstance.selectEvents.length).toBeGreaterThan(0);
  });

  it('never selects disabled nodes', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.selectionMode.set('single');
    fixture.detectChanges();
    selectRow(fixture, 'disabled');
    expect(fixture.componentInstance.selection().size).toBe(0);
  });

  it('supports roving focus, arrows, edges, typeahead, and focus restore', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.selectionMode.set('single');
    fixture.componentInstance.expanded.set(new Set(['workspace']));
    fixture.detectChanges();
    const workspace = row(fixture, 'workspace');
    expect(workspace.tabIndex).toBe(0);
    expect(row(fixture, 'readme').tabIndex).toBe(-1);

    workspace.focus();
    await press(fixture, workspace, 'ArrowDown');
    expect(activeKey()).toBe('readme');
    await press(fixture, row(fixture, 'readme'), 'End');
    expect(activeKey()).toBe('remote');
    await press(fixture, row(fixture, 'remote'), 'Home');
    expect(activeKey()).toBe('workspace');
    await press(fixture, row(fixture, 'workspace'), 'ArrowRight');
    expect(activeKey()).toBe('readme');
    await press(fixture, row(fixture, 'readme'), 'ArrowLeft');
    expect(activeKey()).toBe('workspace');
    await press(fixture, row(fixture, 'workspace'), 'n');
    expect(activeKey()).toBe('notes');

    const workspaceItem = fixture.componentInstance
      .tree()
      .visibleNode('workspace');
    expect(workspaceItem).toBeDefined();
    if (!workspaceItem) throw new Error('Workspace node must be visible.');
    fixture.componentInstance.tree().toggleNode(workspaceItem);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(activeKey()).toBe('workspace');
    expect(row(fixture, 'workspace').tabIndex).toBe(0);
  });

  it('reverses horizontal expansion keys in RTL', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.nativeElement.setAttribute('dir', 'rtl');
    fixture.detectChanges();
    const workspace = row(fixture, 'workspace');
    workspace.focus();
    await press(fixture, workspace, 'ArrowLeft');
    expect(fixture.componentInstance.expanded().has('workspace')).toBe(true);
    await press(fixture, row(fixture, 'workspace'), 'ArrowRight');
    expect(fixture.componentInstance.expanded().has('workspace')).toBe(false);
  });

  it('filters without mutating input and supports strict mode', () => {
    const fixture = TestBed.createComponent(HostComponent);
    const original = fixture.componentInstance.nodes();
    fixture.componentInstance.filter.set('notes');
    fixture.detectChanges();
    expect(row(fixture, 'workspace')).not.toBeNull();
    expect(row(fixture, 'notes').dataset['match']).toBe('true');
    expect(
      fixture.nativeElement.querySelector('[data-key="readme"]'),
    ).toBeNull();
    expect(fixture.componentInstance.nodes()).toBe(original);

    fixture.componentInstance.filter.set('workspace');
    fixture.componentInstance.filterMode.set('strict');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-key="notes"]'),
    ).toBeNull();
  });

  it('renders typed node, toggler, icon, loading, and empty templates', () => {
    const fixture = TestBed.createComponent(TemplateHostComponent);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.custom-node').textContent,
    ).toContain('Custom:false');
    expect(
      fixture.nativeElement.querySelector('.custom-toggler'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.custom-icon').textContent,
    ).toContain('nt-sparkles');
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.custom-loading'),
    ).not.toBeNull();
    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.nodes.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.custom-empty')).not.toBeNull();
  });

  it('exposes compact, virtual range, and retryable lazy error hooks', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.nodes.set([
      {
        key: 'failed',
        label: 'Failed branch',
        leaf: false,
        error: 'Network unavailable',
      },
    ]);
    fixture.componentInstance.expanded.set(new Set(['failed']));
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]').textContent,
    ).toContain('Network unavailable');
    (
      fixture.nativeElement.querySelector(
        '.neural-tree-retry-root',
      ) as HTMLButtonElement
    ).click();
    expect(fixture.componentInstance.lazyEvents).toHaveLength(1);
    expect(fixture.componentInstance.tree().virtualRange().start).toBe(0);
    expect(fixture.componentInstance.tree().virtualItems()).toHaveLength(1);
  });

  it('cleans the typeahead timer on destroy', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    try {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const workspace = row(fixture, 'workspace');
      workspace.focus();
      workspace.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'r' }),
      );
      fixture.destroy();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    } finally {
      clearTimeoutSpy.mockRestore();
    }
  });
});

function selectRow(
  fixture: ComponentFixture<HostComponent>,
  key: string,
  init: MouseEventInit = {},
): void {
  const row = fixture.nativeElement.querySelector(
    `[data-key="${key}"]`,
  ) as HTMLElement;
  row.dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }));
  fixture.detectChanges();
}

function row(
  fixture: ComponentFixture<HostComponent>,
  key: string,
): HTMLElement {
  return fixture.nativeElement.querySelector(
    `[role="treeitem"][data-key="${key}"]`,
  ) as HTMLElement;
}

async function press(
  fixture: ComponentFixture<HostComponent>,
  target: HTMLElement,
  key: string,
): Promise<void> {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function activeKey(): string | undefined {
  return (document.activeElement as HTMLElement | null)?.dataset['key'];
}
