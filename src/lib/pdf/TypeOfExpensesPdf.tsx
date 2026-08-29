import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { LiquidationPdfData } from "./types";

Font.register({
  family: "Times",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman Bold.ttf", fontWeight: "bold" },
  ],
});

const S = StyleSheet.create({
  page: { fontFamily: "Times", fontSize: 8.5, paddingHorizontal: 30, paddingVertical: 24, backgroundColor: "#fff" },
  title: { fontSize: 12, fontWeight: "bold", textAlign: "center", marginBottom: 2 },
  subtitle: { fontSize: 9, textAlign: "center", marginBottom: 8 },
  // table
  table: { width: "100%" },
  tableHeader: { flexDirection: "row", borderWidth: 0.5, borderColor: "#000", backgroundColor: "#d9d9d9" },
  catHeader: { flexDirection: "row", borderLeftWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: "#000", backgroundColor: "#f2f2f2" },
  row: { flexDirection: "row", borderLeftWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: "#000" },
  subtotalRow: { flexDirection: "row", borderWidth: 0.5, borderColor: "#000", backgroundColor: "#f9f9f9" },
  totalRow: { flexDirection: "row", borderWidth: 1, borderColor: "#000", backgroundColor: "#d9d9d9" },
  // columns: Payee | Supporting Docs | Amount
  colPayee: { flex: 2.5, paddingHorizontal: 4, paddingVertical: 2, borderRightWidth: 0.5, borderRightColor: "#000" },
  colDocs: { flex: 2, paddingHorizontal: 4, paddingVertical: 2, borderRightWidth: 0.5, borderRightColor: "#000" },
  colAmount: { flex: 1.2, paddingHorizontal: 4, paddingVertical: 2, textAlign: "right" },
  colHeader: { fontWeight: "bold", textAlign: "center" },
  bold: { fontWeight: "bold" },
  rightAlign: { textAlign: "right" },
});

function peso(n: number): string {
  if (n === 0) return "-";
  return "₱ " + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function docLabel(item: { docType: string; docReference: string | null }): string {
  if (item.docType === "certification") return "Certification";
  if (item.docType === "acknowledgement_receipt") return "Acknowledgement Receipt";
  return item.docReference ?? "";
}

export function TypeOfExpensesPdf({ data }: { data: LiquidationPdfData }) {
  const grandTotal = data.categories.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.amount, 0), 0);

  return (
    <Document>
      <Page size="LETTER" style={S.page}>
        <Text style={S.title}>TYPE OF EXPENSES</Text>
        <Text style={S.subtitle}>
          {data.projectName} | {data.collegeDept} | PR No. {data.prNumber} | {data.date}
        </Text>

        <View style={S.table}>
          {/* Table header */}
          <View style={S.tableHeader}>
            <Text style={[S.colPayee, S.colHeader]}>PAYEE</Text>
            <Text style={[S.colDocs, S.colHeader]}>SUPPORTING DOCUMENTS</Text>
            <Text style={[S.colAmount, S.colHeader]}>AMOUNT</Text>
          </View>

          {data.categories.map((cat) => {
            const subtotal = cat.items.reduce((s, i) => s + i.amount, 0);
            return (
              <React.Fragment key={cat.name}>
                {/* Category header */}
                <View style={S.catHeader}>
                  <Text style={[S.colPayee, S.bold, { flex: 5.7 }]}>{cat.name.toUpperCase()}</Text>
                  <Text style={S.colAmount} />
                </View>

                {/* Items */}
                {cat.items.map((item, i) => (
                  <View key={i} style={S.row}>
                    <Text style={S.colPayee}>{item.payee}</Text>
                    <Text style={S.colDocs}>{docLabel(item)}</Text>
                    <Text style={S.colAmount}>{peso(item.amount)}</Text>
                  </View>
                ))}

                {/* Category subtotal */}
                <View style={S.subtotalRow}>
                  <Text style={[S.colPayee, S.bold]}>Subtotal — {cat.name}</Text>
                  <Text style={S.colDocs} />
                  <Text style={[S.colAmount, S.bold]}>{peso(subtotal)}</Text>
                </View>
              </React.Fragment>
            );
          })}

          {/* Grand total */}
          <View style={S.totalRow}>
            <Text style={[S.colPayee, S.bold]}>GRAND TOTAL</Text>
            <Text style={S.colDocs} />
            <Text style={[S.colAmount, S.bold]}>{peso(grandTotal)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
