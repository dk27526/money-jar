export interface Jar {
    id: string;
    name: string;
    budget: number;
    icon: string;
  }
  
  export interface Transaction {
    id: string;
    type: "income" | "expense";
    amount: number;
    jarId?: string;
    note: string;
    date: string;
  }