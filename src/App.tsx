import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Edit3,
  LayoutDashboard,
  Plus,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wallet,
  X,
  ArrowRightLeft,
} from "lucide-react";

import type { Jar, Transaction } from "./types";

/* =========================================================
   TYPES
========================================================= */

type Page = "dashboard" | "transactions" | "jars";

type TransactionForm = {
  type: "income" | "expense" | "transfer";
  amount: string;
  jarId: string;
  fromJarId: string;
  toJarId: string;
  note: string;
  date: string;
};

/* =========================================================
   DEFAULT DATA
========================================================= */

const defaultJars: Jar[] = [
  {
    id: "food",
    name: "Ăn uống",
    budget: 3000000,
    icon: "🍜",
  },
  {
    id: "shopping",
    name: "Mua sắm",
    budget: 1500000,
    icon: "🛍️",
  },
  {
    id: "transport",
    name: "Di chuyển",
    budget: 1500000,
    icon: "🛵",
  },
  {
    id: "bills",
    name: "Hóa đơn",
    budget: 2000000,
    icon: "🧾",
  },
  {
    id: "other",
    name: "Khác",
    budget: 1000000,
    icon: "💰",
  },
];

const defaultTransactions: Transaction[] = [
  {
    id: "1",
    type: "income",
    amount: 15000000,
    note: "Lương tháng",
    date: "2026-09-01",
  },
  {
    id: "2",
    type: "expense",
    amount: 65000,
    jarId: "food",
    note: "Ăn sáng",
    date: "2026-09-02",
  },
  {
    id: "3",
    type: "expense",
    amount: 85000,
    jarId: "transport",
    note: "Đổ xăng",
    date: "2026-09-03",
  },
  {
    id: "4",
    type: "expense",
    amount: 420000,
    jarId: "shopping",
    note: "Mua quần áo",
    date: "2026-09-04",
  },
  {
    id: "5",
    type: "expense",
    amount: 280000,
    jarId: "bills",
    note: "Tiền điện",
    date: "2026-09-05",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatInputMoney = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("vi-VN");
};

const formatInputMoneyWithCursor = (value: string, cursor: number) => {
  const digitsBefore = value.slice(0, cursor).replace(/\D/g, "").length;
  const formatted = formatInputMoney(value);

  if (!formatted || digitsBefore === 0) {
    return { value: formatted, cursor: 0 };
  }

  let digitCount = 0;
  let nextCursor = formatted.length;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index])) digitCount += 1;
    if (digitCount >= digitsBefore) {
      nextCursor = index + 1;
      break;
    }
  }

  return { value: formatted, cursor: nextCursor };
};

const parseMoney = (value: string) => {
  return Number(value.replace(/\D/g, "")) || 0;
};

const formatDate = (date: string) => {
  if (!date) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

const getCurrentMonth = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getToday = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/* =========================================================
   APP
========================================================= */

function App() {
  /* =======================================================
     STATE
  ======================================================= */

  const [page, setPage] = useState<Page>("dashboard");

  const [jars, setJars] = useState<Jar[]>(() => {
    const saved = localStorage.getItem("expense-manager-jars");

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultJars;
      }
    }

    return defaultJars;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(
      "expense-manager-transactions"
    );

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultTransactions;
      }
    }

    return defaultTransactions;
  });

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [showTransactionModal, setShowTransactionModal] =
    useState(false);

  const [showTransferModal, setShowTransferModal] =
    useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [showJarModal, setShowJarModal] = useState(false);

  const [editingJar, setEditingJar] = useState<Jar | null>(null);

  const [search, setSearch] = useState("");

  const [transactionTypeFilter, setTransactionTypeFilter] =
    useState<"all" | "income" | "expense" | "transfer">("all");

  const [transactionJarFilter, setTransactionJarFilter] =
    useState("all");

  /* =======================================================
     SAVE LOCAL STORAGE
  ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      "expense-manager-jars",
      JSON.stringify(jars)
    );
  }, [jars]);

  useEffect(() => {
    localStorage.setItem(
      "expense-manager-transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  /* =======================================================
     MONTH TRANSACTIONS
  ======================================================= */

  const monthTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      transaction.date.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  /* =======================================================
     TOTALS
  ======================================================= */

  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [monthTransactions]);

  const totalExpense = useMemo(() => {
    return monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [monthTransactions]);

  const totalBudget = useMemo(() => {
    return jars.reduce((sum, jar) => sum + jar.budget, 0);
  }, [jars]);

  const totalRemaining = useMemo(() => {
    return jars.reduce((total, jar) => {
      const spent = monthTransactions
        .filter(
          (transaction) =>
            (transaction.type === "expense" && transaction.jarId === jar.id) ||
            (transaction.type === "transfer" && transaction.fromJarId === jar.id)
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      const received = monthTransactions
        .filter(
          (transaction) =>
            transaction.type === "transfer" && transaction.toJarId === jar.id
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      return total + (jar.budget - spent + received);
    }, 0);
  }, [jars, monthTransactions]);

  const balance = totalIncome - totalExpense;

  /* =======================================================
     JAR CALCULATIONS
  ======================================================= */

  const getJarSpent = (jarId: string) => {
    return monthTransactions
      .filter(
        (transaction) =>
          (transaction.type === "expense" && transaction.jarId === jarId) ||
          (transaction.type === "transfer" && transaction.fromJarId === jarId)
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getJarReceived = (jarId: string) => {
    return monthTransactions
      .filter(
        (transaction) =>
          transaction.type === "transfer" && transaction.toJarId === jarId
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getJarRemaining = (jar: Jar) => {
    return jar.budget - getJarSpent(jar.id) + getJarReceived(jar.id);
  };

  const getJarPercentage = (jar: Jar) => {
    if (jar.budget <= 0) return 0;

    return Math.round(
      (getJarSpent(jar.id) / jar.budget) * 100
    );
  };

  const getJarStatus = (jar: Jar) => {
    const percentage = getJarPercentage(jar);

    if (percentage > 100) {
      return {
        text: "Vượt ngân sách",
        className: "danger",
      };
    }

    if (percentage >= 90) {
      return {
        text: "Sắp hết",
        className: "danger",
      };
    }

    if (percentage >= 70) {
      return {
        text: "Cần chú ý",
        className: "warning",
      };
    }

    return {
      text: "Đang ổn",
      className: "success",
    };
  };

  /* =======================================================
     FILTERED TRANSACTIONS
  ======================================================= */

  const filteredTransactions = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return monthTransactions
      .filter((transaction) => {
        if (
          transactionTypeFilter !== "all" &&
          transaction.type !== transactionTypeFilter
        ) {
          return false;
        }

        if (
          transactionJarFilter !== "all" &&
          transaction.jarId !== transactionJarFilter &&
          transaction.fromJarId !== transactionJarFilter &&
          transaction.toJarId !== transactionJarFilter
        ) {
          return false;
        }

        if (!keyword) {
          return true;
        }

        const jar = jars.find(
          (item) => item.id === transaction.jarId
        );

        return (
          transaction.note
            .toLowerCase()
            .includes(keyword) ||
          jar?.name.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [
    monthTransactions,
    search,
    transactionTypeFilter,
    transactionJarFilter,
    jars,
  ]);

  /* =======================================================
     TRANSACTION ACTIONS
  ======================================================= */

  const openAddTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  };

  const openAddTransfer = () => {
    setEditingTransaction(null);
    setShowTransferModal(true);
  };

  const openEditTransaction = (
    transaction: Transaction
  ) => {
    if (transaction.type === "transfer") {
      setEditingTransaction(transaction);
      setShowTransferModal(true);
      return;
    }

    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const closeTransactionModal = () => {
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  const saveTransaction = (form: TransactionForm) => {
    const amount = parseMoney(form.amount);

    if (amount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    if (!form.date) {
      alert("Vui lòng chọn ngày.");
      return;
    }

    if (
      form.type === "expense" &&
      !form.jarId
    ) {
      alert("Vui lòng chọn hũ chi tiêu.");
      return;
    }

    if (editingTransaction) {
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === editingTransaction.id
            ? {
              ...transaction,
              type: form.type,
              amount,
              jarId:
            form.type === "expense"
                  ? form.jarId
                  : undefined,
              fromJarId: undefined,
              toJarId: undefined,
              note: form.note,
              date: form.date,
            }
            : transaction
        )
      );
    } else {
      const newTransaction: Transaction = {
        id: generateId(),
        type: form.type,
        amount,
        jarId:
          form.type === "expense"
            ? form.jarId
            : undefined,
        fromJarId: undefined,
        toJarId: undefined,
        note: form.note,
        date: form.date,
      };

      setTransactions((current) => [
        ...current,
        newTransaction,
      ]);
    }

    closeTransactionModal();
  };

  const saveTransfer = (form: TransactionForm) => {
    const amount = parseMoney(form.amount);

    if (amount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    if (!form.date) {
      alert("Vui lòng chọn ngày.");
      return;
    }

    if (!form.fromJarId || !form.toJarId) {
      alert("Vui lòng chọn hũ nguồn và hũ đích.");
      return;
    }

    if (form.fromJarId === form.toJarId) {
      alert("Hũ nguồn và hũ đích phải khác nhau.");
      return;
    }

    setTransactions((current) => {
      const transfer = {
        id: editingTransaction?.id ?? generateId(),
        type: "transfer" as const,
        amount,
        fromJarId: form.fromJarId,
        toJarId: form.toJarId,
        note: form.note,
        date: form.date,
      };

      return editingTransaction?.type === "transfer"
        ? current.map((transaction) =>
            transaction.id === editingTransaction.id
              ? transfer
              : transaction
          )
        : [...current, transfer];
    });

    setShowTransferModal(false);
    setEditingTransaction(null);
  };

  const deleteTransaction = (
    transactionId: string
  ) => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa giao dịch này?"
    );

    if (!confirmed) return;

    setTransactions((current) =>
      current.filter(
        (transaction) => transaction.id !== transactionId
      )
    );
  };

  /* =======================================================
     JAR ACTIONS
  ======================================================= */

  const openAddJar = () => {
    setEditingJar(null);
    setShowJarModal(true);
  };

  const openEditJar = (jar: Jar) => {
    setEditingJar(jar);
    setShowJarModal(true);
  };

  const closeJarModal = () => {
    setShowJarModal(false);
    setEditingJar(null);
  };

  const saveJar = (
    name: string,
    budget: string,
    icon: string
  ) => {
    const numericBudget = parseMoney(budget);

    if (!name.trim()) {
      alert("Vui lòng nhập tên hũ.");
      return;
    }

    if (numericBudget <= 0) {
      alert("Ngân sách phải lớn hơn 0.");
      return;
    }

    if (editingJar) {
      setJars((current) =>
        current.map((jar) =>
          jar.id === editingJar.id
            ? {
              ...jar,
              name: name.trim(),
              budget: numericBudget,
              icon,
            }
            : jar
        )
      );
    } else {
      const newJar: Jar = {
        id: generateId(),
        name: name.trim(),
        budget: numericBudget,
        icon: icon || "💰",
      };

      setJars((current) => [
        ...current,
        newJar,
      ]);
    }

    closeJarModal();
  };

  const deleteJar = (jar: Jar) => {
    const hasTransactions = transactions.some(
      (transaction) =>
        transaction.jarId === jar.id
    );

    if (hasTransactions) {
      alert(
        "Không thể xóa hũ này vì đang có giao dịch thuộc hũ."
      );
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa hũ "${jar.name}"?`
    );

    if (!confirmed) return;

    setJars((current) =>
      current.filter(
        (item) => item.id !== jar.id
      )
    );
  };

  /* =======================================================
     RESET DATA
  ======================================================= */

  const resetData = () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa toàn bộ dữ liệu và khôi phục dữ liệu mẫu?"
    );

    if (!confirmed) return;

    setJars(defaultJars);
    setTransactions(defaultTransactions);
  };

  /* =======================================================
     BACKUP
  ======================================================= */

  const backupData = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      jars,
      transactions,
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      {
        type: "application/json",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `money-jar-backup-${getToday()}.json`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const restoreData = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const backup = JSON.parse(
          reader.result as string
        );

        if (
          !Array.isArray(backup.jars) ||
          !Array.isArray(backup.transactions)
        ) {
          alert("File backup không hợp lệ.");
          return;
        }

        const confirmed = window.confirm(
          "Khôi phục dữ liệu sẽ thay thế dữ liệu hiện tại. Bạn có chắc chắn?"
        );

        if (!confirmed) return;

        setJars(backup.jars);
        setTransactions(
          backup.transactions
        );

        alert(
          "Khôi phục dữ liệu thành công!"
        );
      } catch {
        alert(
          "Không thể đọc file backup."
        );
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="app">
      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <Wallet size={22} />
          </div>

          <div>
            <div className="logo-title">
              Money Jar
            </div>

            <div className="logo-subtitle">
              Quản lý chi tiêu
            </div>
          </div>
        </div>

        <nav className="navigation">
          <button
            className={
              page === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPage("dashboard")}
          >
            <LayoutDashboard size={19} />
            <span>Tổng quan</span>
          </button>

          <button
            className={
              page === "transactions"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPage("transactions")}
          >
            <Receipt size={19} />
            <span>Giao dịch</span>
          </button>

          <button
            className={
              page === "jars"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPage("jars")}
          >
            <CircleDollarSign size={19} />
            <span>Hũ chi tiêu</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={resetData}
          >
            <Settings size={19} />
            <span>Khôi phục dữ liệu</span>
          </button>
        </div>
        <div className="backup-section">
          <button
            className="nav-item"
            onClick={backupData}
          >
            <Wallet size={19} />
            <span>Sao lưu dữ liệu</span>
          </button>

          <label className="nav-item">
            <ArrowUpRight size={19} />
            <span>Khôi phục dữ liệu</span>

            <input
              type="file"
              accept=".json,application/json"
              onChange={restoreData}
              hidden
            />
          </label>
        </div>
      </aside>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="main">
        {/* HEADER */}

        <header className="topbar">
          <div>
            <h1>
              {page === "dashboard" &&
                "Tổng quan"}

              {page === "transactions" &&
                "Giao dịch"}

              {page === "jars" &&
                "Hũ chi tiêu"}
            </h1>

            <p>
              Theo dõi tiền của bạn một cách đơn giản.
            </p>
          </div>

          <div className="topbar-actions">
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  event.target.value
                )
              }
              className="month-input"
            />

            <button
              className="primary-button"
              onClick={openAddTransaction}
            >
              <Plus size={18} />
              Thêm giao dịch
            </button>
            <button
              className="secondary-button"
              onClick={openAddTransfer}
            >
              <ArrowRightLeft size={18} />
              Chuyển tiền
            </button>
          </div>
        </header>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        {page === "dashboard" && (
          <Dashboard
            jars={jars}
            transactions={monthTransactions}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            totalBudget={totalBudget}
            totalRemaining={totalRemaining}
            balance={balance}
            getJarSpent={getJarSpent}
            getJarRemaining={getJarRemaining}
            getJarPercentage={getJarPercentage}
            getJarStatus={getJarStatus}
            onAddTransaction={
              openAddTransaction
            }
            onEditTransaction={
              openEditTransaction
            }
            onDeleteTransaction={
              deleteTransaction
            }
          />
        )}

        {/* =================================================
            TRANSACTIONS
        ================================================= */}

        {page === "transactions" && (
          <TransactionsPage
            transactions={filteredTransactions}
            jars={jars}
            search={search}
            setSearch={setSearch}
            typeFilter={transactionTypeFilter}
            setTypeFilter={
              setTransactionTypeFilter
            }
            jarFilter={transactionJarFilter}
            setJarFilter={
              setTransactionJarFilter
            }
            onAdd={openAddTransaction}
            onEdit={openEditTransaction}
            onDelete={deleteTransaction}
          />
        )}

        {/* =================================================
            JARS
        ================================================= */}

        {page === "jars" && (
          <JarsPage
            jars={jars}
            getJarSpent={getJarSpent}
            getJarRemaining={
              getJarRemaining
            }
            getJarPercentage={
              getJarPercentage
            }
            getJarStatus={getJarStatus}
            onAdd={openAddJar}
            onEdit={openEditJar}
            onDelete={deleteJar}
          />
        )}
      </main>

      {/* ===================================================
          TRANSACTION MODAL
      =================================================== */}

      {showTransactionModal && (
        <TransactionModal
          jars={jars}
          transaction={
            editingTransaction
          }
          onClose={closeTransactionModal}
          onSave={saveTransaction}
        />
      )}

      {showTransferModal && (
        <TransferModal
          jars={jars}
          transaction={
            editingTransaction?.type === "transfer"
              ? editingTransaction
              : null
          }
          onClose={() => setShowTransferModal(false)}
          onSave={saveTransfer}
        />
      )}

      {/* ===================================================
          JAR MODAL
      =================================================== */}

      {showJarModal && (
        <JarModal
          jar={editingJar}
          onClose={closeJarModal}
          onSave={saveJar}
        />
      )}
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

type DashboardProps = {
  jars: Jar[];
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  totalBudget: number;
  totalRemaining: number;
  balance: number;
  getJarSpent: (jarId: string) => number;
  getJarRemaining: (jar: Jar) => number;
  getJarPercentage: (jar: Jar) => number;
  getJarStatus: (
    jar: Jar
  ) => {
    text: string;
    className: string;
  };
  onAddTransaction: () => void;
  onEditTransaction: (
    transaction: Transaction
  ) => void;
  onDeleteTransaction: (
    transactionId: string
  ) => void;
};

function Dashboard({
  jars,
  transactions,
  totalIncome,
  totalExpense,
  totalBudget,
  totalRemaining,
  balance,
  getJarSpent,
  getJarRemaining,
  getJarPercentage,
  getJarStatus,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: DashboardProps) {
  const recentTransactions = [...transactions]
    .sort((a, b) =>
      b.date.localeCompare(a.date)
    )
    .slice(0, 5);

  return (
    <div className="page-content">
      {/* SUMMARY */}

      <section className="summary-grid">
        <SummaryCard
          title="Thu nhập"
          value={totalIncome}
          icon={<TrendingUp size={22} />}
          className="income"
        />

        <SummaryCard
          title="Chi tiêu"
          value={totalExpense}
          icon={<TrendingDown size={22} />}
          className="expense"
        />

        <SummaryCard
          title="Ngân sách các hũ"
          value={totalBudget}
          icon={<Wallet size={22} />}
          className="budget"
        />

        <SummaryCard
          title="Số dư"
          value={balance}
          icon={<BarChart3 size={22} />}
          className="balance"
        />
      </section>

      {/* JARS */}

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Hũ chi tiêu</h2>

            <p>
              Theo dõi số tiền còn lại trong từng hũ.
            </p>
          </div>
        </div>

        <div className="jar-grid">
          {jars.map((jar) => {
            const spent =
              getJarSpent(jar.id);

            const remaining =
              getJarRemaining(jar);

            const percentage =
              getJarPercentage(jar);

            const status =
              getJarStatus(jar);

            return (
              <div
                className="jar-card"
                key={jar.id}
              >
                <div className="jar-card-top">
                  <div className="jar-icon">
                    {jar.icon}
                  </div>

                  <span
                    className={`status ${status.className}`}
                  >
                    {status.text}
                  </span>
                </div>

                <h3>{jar.name}</h3>

                <div className="jar-remaining">
                  {formatMoney(remaining)}
                </div>

                <div className="jar-label">
                  còn lại
                </div>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(
                        percentage,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="jar-info">
                  <span>
                    Đã chi{" "}
                    <strong>
                      {formatMoney(spent)}
                    </strong>
                  </span>

                  <span>
                    / {formatMoney(jar.budget)}
                  </span>
                </div>

                <div className="jar-percent">
                  {percentage}% đã sử dụng
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TOTAL REMAINING */}

      <section className="remaining-banner">
        <div className="remaining-banner-icon">
          <Wallet size={25} />
        </div>

        <div>
          <div className="remaining-banner-title">
            Tổng tiền còn lại trong các hũ
          </div>

          <div className="remaining-banner-value">
            {formatMoney(totalRemaining)}
          </div>
        </div>

        <button
          className="secondary-button"
          onClick={onAddTransaction}
        >
          <Plus size={17} />
          Thêm chi tiêu
        </button>
      </section>

      {/* RECENT */}

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Giao dịch gần đây</h2>

            <p>
              Những giao dịch mới nhất trong tháng.
            </p>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            message="Chưa có giao dịch nào."
          />
        ) : (
          <div className="transaction-list">
            {recentTransactions.map(
              (transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  jars={jars}
                  onEdit={
                    onEditTransaction
                  }
                  onDelete={
                    onDeleteTransaction
                  }
                />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

type SummaryCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  className: string;
};

function SummaryCard({
  title,
  value,
  icon,
  className,
}: SummaryCardProps) {
  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <span>{title}</span>

        <div
          className={`summary-icon ${className}`}
        >
          {icon}
        </div>
      </div>

      <div className="summary-value">
        {formatMoney(value)}
      </div>
    </div>
  );
}

/* =========================================================
   TRANSACTIONS PAGE
========================================================= */

type TransactionsPageProps = {
  transactions: Transaction[];
  jars: Jar[];
  search: string;
  setSearch: (value: string) => void;
  typeFilter: "all" | "income" | "expense" | "transfer";
  setTypeFilter: (
    value: "all" | "income" | "expense"
  ) => void;
  jarFilter: string;
  setJarFilter: (value: string) => void;
  onAdd: () => void;
  onEdit: (
    transaction: Transaction
  ) => void;
  onDelete: (
    transactionId: string
  ) => void;
};

function TransactionsPage({
  transactions,
  jars,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  jarFilter,
  setJarFilter,
  onAdd,
  onEdit,
  onDelete,
}: TransactionsPageProps) {
  return (
    <div className="page-content">
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Tất cả giao dịch</h2>

            <p>
              Quản lý thu nhập và chi tiêu của bạn.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={onAdd}
          >
            <Plus size={18} />
            Thêm giao dịch
          </button>
        </div>

        {/* FILTERS */}

        <div className="filters">
          <div className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Tìm giao dịch..."
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value as
                | "all"
                | "income"
                | "expense"
              )
            }
          >
            <option value="all">
              Tất cả
            </option>

            <option value="income">
              Thu nhập
            </option>

            <option value="expense">
              Chi tiêu
            </option>

            <option value="transfer">
              Chuyển tiền
            </option>
          </select>

          <select
            value={jarFilter}
            onChange={(event) =>
              setJarFilter(event.target.value)
            }
          >
            <option value="all">
              Tất cả hũ
            </option>

            {jars.map((jar) => (
              <option
                key={jar.id}
                value={jar.id}
              >
                {jar.icon} {jar.name}
              </option>
            ))}
          </select>
        </div>

        {/* LIST */}

        {transactions.length === 0 ? (
          <EmptyState message="Không tìm thấy giao dịch." />
        ) : (
          <div className="transaction-list">
            {transactions.map(
              (transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  jars={jars}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   TRANSACTION ROW
========================================================= */

type TransactionRowProps = {
  transaction: Transaction;
  jars: Jar[];
  onEdit: (
    transaction: Transaction
  ) => void;
  onDelete: (
    transactionId: string
  ) => void;
};

function TransactionRow({
  transaction,
  jars,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const jar = jars.find(
    (item) => item.id === transaction.jarId
  );

  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";
  const fromJar = jars.find((item) => item.id === transaction.fromJarId);
  const toJar = jars.find((item) => item.id === transaction.toJarId);

  return (
    <div className="transaction-row">
      <div
        className={`transaction-icon ${isTransfer ? "transfer" : isIncome ? "income" : "expense"
          }`}
      >
        {isTransfer ? (
          <ArrowRightLeft size={20} />
        ) : isIncome ? (
          <ArrowUpCircle size={20} />
        ) : (
          <ArrowDownCircle size={20} />
        )}
      </div>

      <div className="transaction-main">
        <div className="transaction-title">
          {transaction.note || (isTransfer ? "Chuyển tiền" : isIncome ? "Thu nhập" : "Chi tiêu")}
        </div>

        <div className="transaction-meta">
          {isTransfer
            ? `${fromJar?.icon ?? ""} ${fromJar?.name ?? "Hũ nguồn"} → ${toJar?.icon ?? ""} ${toJar?.name ?? "Hũ đích"}`
            : isIncome
              ? "Thu nhập"
              : jar
              ? `${jar.icon} ${jar.name}`
              : "Không có hũ"}

          {" • "}

          {formatDate(transaction.date)}
        </div>
      </div>

      <div
        className={`transaction-amount ${isTransfer ? "transfer" : isIncome ? "income" : "expense"
          }`}
      >
        {isTransfer ? "↔" : isIncome ? "+" : "-"}
        {formatMoney(transaction.amount)}
      </div>

      <div className="transaction-actions">
        <button
          className="icon-button"
          onClick={() => onEdit(transaction)}
          title="Sửa"
        >
          <Edit3 size={17} />
        </button>

        <button
          className="icon-button danger"
          onClick={() =>
            onDelete(transaction.id)
          }
          title="Xóa"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   JARS PAGE
========================================================= */

type JarsPageProps = {
  jars: Jar[];
  getJarSpent: (jarId: string) => number;
  getJarRemaining: (jar: Jar) => number;
  getJarPercentage: (jar: Jar) => number;
  getJarStatus: (
    jar: Jar
  ) => {
    text: string;
    className: string;
  };
  onAdd: () => void;
  onEdit: (jar: Jar) => void;
  onDelete: (jar: Jar) => void;
};

function JarsPage({
  jars,
  getJarSpent,
  getJarRemaining,
  getJarPercentage,
  getJarStatus,
  onAdd,
  onEdit,
  onDelete,
}: JarsPageProps) {
  return (
    <div className="page-content">
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Quản lý hũ</h2>

            <p>
              Tạo và thiết lập ngân sách cho từng
              khoản chi tiêu.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={onAdd}
          >
            <Plus size={18} />
            Thêm hũ
          </button>
        </div>

        <div className="jar-management-grid">
          {jars.map((jar) => {
            const spent =
              getJarSpent(jar.id);

            const remaining =
              getJarRemaining(jar);

            const percentage =
              getJarPercentage(jar);

            const status =
              getJarStatus(jar);

            return (
              <div
                className="management-card"
                key={jar.id}
              >
                <div className="management-top">
                  <div className="jar-icon large">
                    {jar.icon}
                  </div>

                  <div className="management-actions">
                    <button
                      className="icon-button"
                      onClick={() =>
                        onEdit(jar)
                      }
                    >
                      <Edit3 size={17} />
                    </button>

                    <button
                      className="icon-button danger"
                      onClick={() =>
                        onDelete(jar)
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <h3>{jar.name}</h3>

                <div className="management-budget">
                  {formatMoney(jar.budget)}
                </div>

                <div className="management-label">
                  ngân sách / tháng
                </div>

                <div className="management-stats">
                  <div>
                    <span>Đã chi</span>

                    <strong>
                      {formatMoney(spent)}
                    </strong>
                  </div>

                  <div>
                    <span>Còn lại</span>

                    <strong>
                      {formatMoney(
                        Math.max(
                          remaining,
                          0
                        )
                      )}
                    </strong>
                  </div>
                </div>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(
                        percentage,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="management-footer">
                  <span
                    className={`status ${status.className}`}
                  >
                    {status.text}
                  </span>

                  <span>
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   TRANSACTION MODAL
========================================================= */

type TransactionModalProps = {
  jars: Jar[];
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (
    form: TransactionForm
  ) => void;
};

function TransactionModal({
  jars,
  transaction,
  onClose,
  onSave,
}: TransactionModalProps) {
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<"income" | "expense">(
    transaction?.type === "income" ? "income" : "expense"
  );

  const [amount, setAmount] =
    useState(
      transaction
        ? formatInputMoney(
          String(transaction.amount)
        )
        : ""
    );

  const [jarId, setJarId] = useState(
    transaction?.jarId ?? jars[0]?.id ?? ""
  );

  const [note, setNote] = useState(
    transaction?.note ?? ""
  );

  const [date, setDate] = useState(
    transaction?.date ?? getToday()
  );

  const handleSubmit = (
    event: FormEvent
  ) => {
    event.preventDefault();

    onSave({
      type,
      amount,
      jarId,
      fromJarId: "",
      toJarId: "",
      note,
      date,
    });
  };

  return (
    <Modal
      title={
        transaction
          ? "Sửa giao dịch"
          : "Thêm giao dịch"
      }
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={handleSubmit}
      >
        {/* TYPE */}

        <div className="form-group">
          <label>Loại giao dịch</label>

          <div className="type-switch">
            <button
              type="button"
              className={
                type === "expense"
                  ? "type-button active expense"
                  : "type-button"
              }
              onClick={() =>
                setType("expense")
              }
            >
              <ArrowDownCircle size={18} />
              Chi tiêu
            </button>

            <button
              type="button"
              className={
                type === "income"
                  ? "type-button active income"
                  : "type-button"
              }
              onClick={() =>
                setType("income")
              }
            >
              <ArrowUpCircle size={18} />
              Thu nhập
            </button>
          </div>
        </div>

        {/* AMOUNT */}

        <div className="form-group">
          <label>Số tiền</label>

          <div className="money-input-wrapper">
            <input
              autoFocus
              ref={amountInputRef}
              value={amount}
              onChange={(event) => {
                const result = formatInputMoneyWithCursor(event.target.value, event.target.selectionStart ?? event.target.value.length);
                setAmount(result.value);
                requestAnimationFrame(() => amountInputRef.current?.setSelectionRange(result.cursor, result.cursor));
              }}
              placeholder="0"
              inputMode="numeric"
            />

            <span>VNĐ</span>
          </div>
        </div>

        {/* JAR */}

        {type === "expense" && (
          <div className="form-group">
            <label>Hũ chi tiêu</label>

            <select
              value={jarId}
              onChange={(event) =>
                setJarId(
                  event.target.value
                )
              }
            >
              {jars.map((jar) => (
                <option
                  key={jar.id}
                  value={jar.id}
                >
                  {jar.icon} {jar.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* NOTE */}

        <div className="form-group">
          <label>Ghi chú</label>

          <input
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            placeholder="Ví dụ: Ăn trưa..."
          />
        </div>

        {/* DATE */}

        <div className="form-group">
          <label>Ngày</label>

          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
          />
        </div>

        {/* ACTIONS */}

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Hủy
          </button>

          <button
            type="submit"
            className="primary-button"
          >
            {transaction
              ? "Lưu thay đổi"
              : "Thêm giao dịch"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TransferModal({
  jars,
  transaction,
  onClose,
  onSave,
}: {
  jars: Jar[];
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (form: TransactionForm) => void;
}) {
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState(
    transaction ? formatInputMoney(String(transaction.amount)) : ""
  );
  const [fromJarId, setFromJarId] = useState(
    transaction?.fromJarId ?? jars[0]?.id ?? ""
  );
  const [toJarId, setToJarId] = useState(
    transaction?.toJarId ?? jars[1]?.id ?? jars[0]?.id ?? ""
  );
  const [note, setNote] = useState(transaction?.note ?? "");
  const [date, setDate] = useState(transaction?.date ?? getToday());

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      type: "transfer",
      amount,
      jarId: "",
      fromJarId,
      toJarId,
      note,
      date,
    });
  };

  return (
    <Modal title={transaction ? "Sửa chuyển tiền" : "Chuyển tiền giữa các hũ"} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Số tiền</label>
          <div className="money-input-wrapper">
            <input autoFocus ref={amountInputRef} value={amount} onChange={(event) => {
              const result = formatInputMoneyWithCursor(event.target.value, event.target.selectionStart ?? event.target.value.length);
              setAmount(result.value);
              requestAnimationFrame(() => amountInputRef.current?.setSelectionRange(result.cursor, result.cursor));
            }} placeholder="0" inputMode="numeric" />
            <span>VNĐ</span>
          </div>
        </div>

        <div className="form-group">
          <label>Chuyển từ hũ</label>
          <select value={fromJarId} onChange={(event) => setFromJarId(event.target.value)}>
            {jars.map((jar) => <option key={jar.id} value={jar.id}>{jar.icon} {jar.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Chuyển đến hũ</label>
          <select value={toJarId} onChange={(event) => setToJarId(event.target.value)}>
            {jars.map((jar) => <option key={jar.id} value={jar.id}>{jar.icon} {jar.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Ghi chú</label>
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ví dụ: Bù ngân sách..." />
        </div>

        <div className="form-group">
          <label>Ngày</label>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
          <button type="submit" className="primary-button"><ArrowRightLeft size={18} /> {transaction ? "Lưu thay đổi" : "Chuyển tiền"}</button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   JAR MODAL
========================================================= */

type JarModalProps = {
  jar: Jar | null;
  onClose: () => void;
  onSave: (
    name: string,
    budget: string,
    icon: string
  ) => void;
};

function JarModal({
  jar,
  onClose,
  onSave,
}: JarModalProps) {
  const budgetInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(
    jar?.name ?? ""
  );

  const [budget, setBudget] =
    useState(
      jar
        ? formatInputMoney(
          String(jar.budget)
        )
        : ""
    );

  const [icon, setIcon] = useState(
    jar?.icon ?? "💰"
  );

  const handleSubmit = (
    event: FormEvent
  ) => {
    event.preventDefault();

    onSave(name, budget, icon);
  };

  return (
    <Modal
      title={
        jar ? "Sửa hũ" : "Thêm hũ"
      }
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label>Tên hũ</label>

          <input
            autoFocus
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Ví dụ: Ăn uống"
          />
        </div>

        <div className="form-group">
          <label>Ngân sách / tháng</label>

          <div className="money-input-wrapper">
            <input
              ref={budgetInputRef}
              value={budget}
              onChange={(event) => {
                const result = formatInputMoneyWithCursor(event.target.value, event.target.selectionStart ?? event.target.value.length);
                setBudget(result.value);
                requestAnimationFrame(() => budgetInputRef.current?.setSelectionRange(result.cursor, result.cursor));
              }}
              placeholder="3.000.000"
              inputMode="numeric"
            />

            <span>VNĐ</span>
          </div>
        </div>

        <div className="form-group">
          <label>Biểu tượng</label>

          <div className="emoji-options">
            {[
              "🍜",
              "🛍️",
              "🛵",
              "🧾",
              "💰",
              "🎮",
              "🏠",
              "✈️",
            ].map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={
                  icon === emoji
                    ? "emoji-button active"
                    : "emoji-button"
                }
                onClick={() =>
                  setIcon(emoji)
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Hủy
          </button>

          <button
            type="submit"
            className="primary-button"
          >
            {jar
              ? "Lưu thay đổi"
              : "Tạo hũ"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   MODAL
========================================================= */

type ModalProps = {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

function Modal({
  title,
  children,
  onClose,
}: ModalProps) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>

          <button
            className="icon-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="empty-state">
      <CircleDollarSign size={35} />

      <p>{message}</p>
    </div>
  );
}

export default App;
