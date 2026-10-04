export interface Jar {
    id: string;
    name: string;
    budget: number;
    icon: string;
  }
  
  export interface Transaction {
    id: string;
    type: "income" | "expense" | "transfer";
    amount: number;
    jarId?: string;
    fromJarId?: string;
    toJarId?: string;
    note: string;
    date: string;
  }
