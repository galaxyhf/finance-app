export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export type Transaction = {
  id: string;
  userId: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  description: string;
  date: string;
  createdAt: string;
  category: Category;
};
