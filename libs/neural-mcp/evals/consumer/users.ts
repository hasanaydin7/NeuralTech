import { Component, computed, inject, signal } from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralConfirmDialog,
  NeuralConfirmationService,
} from '@neural-ng/core/confirm-dialog';
import { NeuralDrawer } from '@neural-ng/core/drawer';
import { NeuralInput } from '@neural-ng/core/input';
import { NeuralPaginator } from '@neural-ng/core/paginator';
import { NeuralSelect } from '@neural-ng/core/select';
import {
  NeuralTable,
  NeuralTableCellDirective,
  type NeuralTableColumn,
} from '@neural-ng/core/table';
import { NeuralToolbar } from '@neural-ng/core/toolbar';

interface User {
  id: number;
  name: string;
  role: string;
}

@Component({
  selector: 'neural-mcp-eval-users',
  imports: [
    NeuralButton,
    NeuralConfirmDialog,
    NeuralDrawer,
    NeuralInput,
    NeuralPaginator,
    NeuralSelect,
    NeuralTable,
    NeuralTableCellDirective,
    NeuralToolbar,
  ],
  templateUrl: './users.html',
})
export class UsersPage {
  private readonly confirmation = inject(NeuralConfirmationService);
  readonly users = signal<User[]>([
    { id: 1, name: 'Ada', role: 'admin' },
    { id: 2, name: 'Grace', role: 'member' },
    { id: 3, name: 'Linus', role: 'member' },
  ]);
  readonly query = signal('');
  readonly role = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(2);
  readonly detailsOpen = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Member', value: 'member' },
  ];
  readonly columns: readonly NeuralTableColumn<User>[] = [
    { id: 'name', header: 'Name', field: 'name' },
    { id: 'role', header: 'Role', field: 'role' },
    { id: 'actions', header: 'Actions' },
  ];
  readonly filteredUsers = computed(() =>
    this.users().filter(
      (user) =>
        user.name.toLowerCase().includes(this.query().toLowerCase()) &&
        (!this.role() || user.role === this.role()),
    ),
  );
  readonly pageUsers = computed(() =>
    this.filteredUsers().slice(
      this.pageIndex() * this.pageSize(),
      (this.pageIndex() + 1) * this.pageSize(),
    ),
  );

  search(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.query.set(event.target.value);
    this.pageIndex.set(0);
  }

  filterRole(value: unknown): void {
    this.role.set(typeof value === 'string' ? value : null);
    this.pageIndex.set(0);
  }

  showDetails(row: unknown): void {
    const user = this.resolveUser(row);
    if (!user) return;
    this.selectedUser.set(user);
    this.detailsOpen.set(true);
  }

  requestDelete(row: unknown): void {
    const user = this.resolveUser(row);
    if (!user) return;
    this.confirmation.confirm({
      header: 'Delete user?',
      message: `Delete ${user.name}?`,
      accept: () => {
        this.users.update((users) =>
          users.filter((item) => item.id !== user.id),
        );
        this.pageIndex.set(0);
        if (this.selectedUser()?.id === user.id) {
          this.selectedUser.set(null);
          this.detailsOpen.set(false);
        }
      },
    });
  }

  private resolveUser(row: unknown): User | undefined {
    return typeof row === 'object' && row !== null && 'id' in row
      ? this.users().find((user) => user.id === row.id)
      : undefined;
  }
}
