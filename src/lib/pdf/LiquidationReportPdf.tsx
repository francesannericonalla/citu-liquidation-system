import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { LiquidationPdfData } from "./types";

Font.register({
  family: "Times",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman Bold.ttf", fontWeight: "bold" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman Italic.ttf", fontStyle: "italic" },
  ],
});

const S = StyleSheet.create({
  page: { fontFamily: "Times", fontSize: 9, paddingHorizontal: 36, paddingVertical: 28, backgroundColor: "#fff" },
  // header
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 2 },
  logo: { width: 52, height: 52, marginRight: 8 },
  headerText: { textAlign: "center", flex: 1 },
  schoolName: { fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 },
  schoolSub: { fontSize: 8 },
  divider: { borderBottomWidth: 1.5, borderBottomColor: "#000", marginVertical: 3 },
  thinDivider: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginVertical: 2 },
  docTitle: { fontSize: 13, fontWeight: "bold", textAlign: "center", marginVertical: 4, textDecoration: "underline" },
  // fields
  fieldRow: { flexDirection: "row", marginBottom: 3 },
  fieldLabel: { fontSize: 9 },
  fieldValue: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#000", fontSize: 9, paddingBottom: 1, marginLeft: 2 },
  fieldGroup: { flexDirection: "row", flex: 1, alignItems: "flex-end" },
  // table
  table: { marginTop: 6 },
  tableHeader: { flexDirection: "row", borderWidth: 0.5, borderColor: "#000", backgroundColor: "#f0f0f0" },
  tableRow: { flexDirection: "row", borderLeftWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: "#000" },
  tableRowTotal: { flexDirection: "row", borderWidth: 0.5, borderColor: "#000", backgroundColor: "#f0f0f0" },
  col1: { flex: 2.5, paddingHorizontal: 4, paddingVertical: 3, borderRightWidth: 0.5, borderRightColor: "#000" },
  col2: { flex: 1.5, paddingHorizontal: 4, paddingVertical: 3, textAlign: "right", borderRightWidth: 0.5, borderRightColor: "#000" },
  col3: { flex: 1.5, paddingHorizontal: 4, paddingVertical: 3, textAlign: "right", borderRightWidth: 0.5, borderRightColor: "#000" },
  col4: { flex: 1.5, paddingHorizontal: 4, paddingVertical: 3, textAlign: "right" },
  colHeader: { fontWeight: "bold", textAlign: "center" },
  // note
  noteText: { fontSize: 7.5, fontStyle: "italic", marginTop: 4, marginBottom: 4 },
  // totals section
  totalsSection: { flexDirection: "row", marginTop: 4, gap: 8 },
  totalsLeft: { flex: 1 },
  totalsRight: { flex: 1 },
  totalsRow: { flexDirection: "row", marginBottom: 2, alignItems: "flex-end" },
  totalsLabel: { fontSize: 9, flex: 1 },
  totalsValue: { borderBottomWidth: 0.5, borderBottomColor: "#000", fontSize: 9, width: 90, textAlign: "right", paddingRight: 2 },
  // certification text
  certText: { fontSize: 8, marginTop: 6, marginBottom: 6, lineHeight: 1.4 },
  // signature
  sigRow: { flexDirection: "row", marginTop: 8, gap: 16 },
  sigBlock: { flex: 1 },
  sigLabel: { fontSize: 8, marginBottom: 2 },
  sigLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginBottom: 1 },
  sigName: { fontSize: 9, fontWeight: "bold", textAlign: "center" },
  sigRole: { fontSize: 8, textAlign: "center", color: "#333" },
  sigId: { fontSize: 7.5, textAlign: "center", color: "#555" },
  // notary
  notaryRow: { flexDirection: "row", marginTop: 10, gap: 8 },
  notaryText: { fontSize: 8 },
  notaryLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", flex: 1, marginBottom: 1, marginLeft: 2 },
  notaryBlock: { flexDirection: "row", marginTop: 4, gap: 12 },
  notaryItem: { flexDirection: "row", alignItems: "flex-end" },
  notaryItemLabel: { fontSize: 8 },
  notaryItemLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", width: 40, marginLeft: 2 },
});

function peso(n: number): string {
  if (n === 0) return "-";
  return "₱ " + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LiquidationReportPdf({ data }: { data: LiquidationPdfData }) {
  const { categories } = data;

  const FIXED_CATEGORIES = ["Registration", "Accommodation", "Meals/Foods/Snacks", "Supplies", "Documentation", "Transportation"];
  const fixed = FIXED_CATEGORIES.map((name) => {
    const found = categories.find((c) => c.name === name);
    return found ?? { name, approvedBudgetAmount: 0, items: [] };
  });
  const others = categories.filter((c) => !FIXED_CATEGORIES.includes(c.name));

  function catActual(cat: typeof categories[0]) {
    return cat.items.reduce((s, i) => s + i.amount, 0);
  }

  return (
    <Document>
      <Page size="LETTER" style={S.page}>
        {/* Header */}
        <View style={S.headerRow}>
          <Image src="/citu-logo.jpg" style={S.logo} />
          <View style={S.headerText}>
            <Text style={S.schoolName}>Cebu Institute of Technology – University</Text>
            <Text style={S.schoolSub}>N. Bacalso Avenue, Cebu City</Text>
            <Text style={S.schoolSub}>FINANCE AND ACCOUNTING</Text>
          </View>
          <Image src="/citu-logo.jpg" style={S.logo} />
        </View>
        <View style={S.divider} />

        <Text style={S.docTitle}>LIQUIDATION REPORT</Text>

        {/* Field rows */}
        <View style={S.fieldRow}>
          <Text style={S.fieldLabel}>Payer Name: </Text>
          <Text style={[S.fieldValue, { flex: 2 }]}>{data.payerName}</Text>
          <Text style={[S.fieldLabel, { marginLeft: 8 }]}>PR No.: </Text>
          <Text style={S.fieldValue}>{data.prNumber}</Text>
          <Text style={[S.fieldLabel, { marginLeft: 8 }]}>Date: </Text>
          <Text style={S.fieldValue}>{data.date}</Text>
        </View>
        <View style={S.fieldRow}>
          <Text style={S.fieldLabel}>Project Name/Activity of Project.: </Text>
          <Text style={[S.fieldValue, { flex: 3 }]}>{data.projectName}</Text>
        </View>
        <View style={S.fieldRow}>
          <Text style={S.fieldLabel}>College/Dept.: </Text>
          <Text style={[S.fieldValue, { flex: 3 }]}>{data.collegeDept}</Text>
        </View>
        <View style={S.fieldRow}>
          <Text style={S.fieldLabel}>APPROVED BUDGET PER CV/CDV No. </Text>
          <Text style={S.fieldValue}>{data.cvCdvNumber ?? ""}</Text>
          <Text style={[S.fieldLabel, { marginLeft: 8 }]}>AMOUNT </Text>
          <Text style={S.fieldValue}>{data.approvedBudgetTotal > 0 ? peso(data.approvedBudgetTotal) : ""}</Text>
          <Text style={[S.fieldLabel, { marginLeft: 8 }]}>DATE of CV/CDV </Text>
          <Text style={S.fieldValue}>{data.cvCdvDate ?? ""}</Text>
        </View>

        {/* Expense Table */}
        <View style={S.table}>
          <View style={S.tableHeader}>
            <Text style={[S.col1, S.colHeader]}>EXPENSE ACCOUNTS/ITEMS{"\n"}(Please use additional pages if necessary)</Text>
            <Text style={[S.col2, S.colHeader]}>APPROVED{"\n"}BUDGET</Text>
            <Text style={[S.col3, S.colHeader]}>ACTUAL{"\n"}EXPENSE</Text>
            <Text style={[S.col4, S.colHeader]}>VARIANCE</Text>
          </View>

          {fixed.map((cat) => {
            const actual = catActual(cat);
            const variance = cat.approvedBudgetAmount - actual;
            return (
              <View key={cat.name} style={S.tableRow}>
                <Text style={S.col1}>{cat.name}</Text>
                <Text style={S.col2}>{cat.approvedBudgetAmount === 0 ? "-" : peso(cat.approvedBudgetAmount)}</Text>
                <Text style={S.col3}>{actual === 0 ? "-" : peso(actual)}</Text>
                <Text style={S.col4}>{cat.approvedBudgetAmount === 0 && actual === 0 ? "-" : peso(Math.abs(variance))}</Text>
              </View>
            );
          })}

          {/* OTHERS header row */}
          <View style={S.tableRow}>
            <Text style={[S.col1, { fontWeight: "bold" }]}>OTHERS:</Text>
            <Text style={S.col2} />
            <Text style={S.col3} />
            <Text style={S.col4} />
          </View>
          {others.length === 0 ? (
            <View style={S.tableRow}>
              <Text style={S.col1} />
              <Text style={S.col2}>-</Text>
              <Text style={S.col3}>-</Text>
              <Text style={S.col4}>-</Text>
            </View>
          ) : (
            others.map((cat) => {
              const actual = catActual(cat);
              const variance = cat.approvedBudgetAmount - actual;
              return (
                <View key={cat.name} style={S.tableRow}>
                  <Text style={S.col1}>{cat.name}</Text>
                  <Text style={S.col2}>{cat.approvedBudgetAmount === 0 ? "-" : peso(cat.approvedBudgetAmount)}</Text>
                  <Text style={S.col3}>{actual === 0 ? "-" : peso(actual)}</Text>
                  <Text style={S.col4}>{cat.approvedBudgetAmount === 0 && actual === 0 ? "-" : peso(Math.abs(variance))}</Text>
                </View>
              );
            })
          )}

          {/* Total row */}
          <View style={S.tableRowTotal}>
            <Text style={[S.col1, { fontWeight: "bold" }]}>TOTAL</Text>
            <Text style={[S.col2, { fontWeight: "bold" }]}>{peso(data.totalApproved)}</Text>
            <Text style={[S.col3, { fontWeight: "bold" }]}>{peso(data.totalActual)}</Text>
            <Text style={[S.col4, { fontWeight: "bold" }]}>{peso(data.totalVariance)}</Text>
          </View>
        </View>

        <Text style={S.noteText}>
          NOTE: (PLEASE ATTACH INVOICES, OFFICIAL RECEIPTS AND OTHER SUPPORTING DOCUMENTS)
        </Text>

        {/* Totals section */}
        <View style={S.totalsSection}>
          <View style={S.totalsLeft}>
            <View style={S.totalsRow}>
              <Text style={S.totalsLabel}>ACTUAL EXPENSES</Text>
              <Text style={S.totalsValue}>{peso(data.totalActual)}</Text>
            </View>
            <View style={S.totalsRow}>
              <Text style={S.totalsLabel}>EXCESS BUDGET PER O.R. N.O.</Text>
              <Text style={S.totalsValue}>{data.excessAmount != null ? peso(data.excessAmount) : ""}</Text>
            </View>
            <View style={S.totalsRow}>
              <Text style={S.totalsLabel}>DATE OF OR</Text>
              <Text style={S.totalsValue}> </Text>
            </View>
            <View style={S.totalsRow}>
              <Text style={S.totalsLabel}>RETURNED AMOUNT</Text>
              <Text style={S.totalsValue}>{data.returnedAmount != null ? peso(data.returnedAmount) : ""}</Text>
            </View>
          </View>
        </View>

        {/* Certification text */}
        <Text style={S.certText}>
          I hereby certify that statements made herein are true and correct to the best of my knowledge and belief and that the above expenses are incurred as they are necessary for the intended purpose. And that I am fully aware that willful falsification of documents and/or statements is administratively and/or criminally punishable.
        </Text>

        {/* Signature blocks */}
        <View style={S.sigRow}>
          <View style={S.sigBlock}>
            <Text style={S.sigLabel}>A) Certified: Correctness of the above data.</Text>
            <View style={{ marginTop: 16 }}>
              <Text style={S.sigName}>{data.claimantName}</Text>
              <View style={S.sigLine} />
              <Text style={S.sigRole}>Claimant (Signature of Printed Name)</Text>
              <Text style={S.sigId}>Gov. Issued ID ___________________</Text>
            </View>
          </View>
          <View style={S.sigBlock}>
            <Text style={S.sigLabel}>B) Certified: Purpose of approved budget duly accomplished</Text>
            <View style={{ marginTop: 16 }}>
              <Text style={S.sigName}>{data.deanHeadName}</Text>
              <View style={S.sigLine} />
              <Text style={S.sigRole}>Dean/Dept. Head (Signature of Printed Name)</Text>
              <Text style={S.sigId}>Gov. Issued ID ___________________</Text>
            </View>
          </View>
        </View>

        {/* Notary block */}
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <Text style={S.notaryText}>SUBSCRIBED AND SWORN TO before me this </Text>
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#000", width: 50 }} />
            <Text style={S.notaryText}> at </Text>
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#000", flex: 1 }} />
            <Text style={S.notaryText}> affiant(s) having exhibited to me her/his/their competence evidence of identity above stated.</Text>
          </View>
          <View style={[S.notaryBlock, { marginTop: 6 }]}>
            {["Doc. No.", "Page No.", "Book No."].map((lbl) => (
              <View key={lbl} style={S.notaryItem}>
                <Text style={S.notaryItemLabel}>{lbl} </Text>
                <View style={S.notaryItemLine} />
              </View>
            ))}
            <View style={S.notaryItem}>
              <Text style={S.notaryItemLabel}>Series of 20</Text>
              <View style={[S.notaryItemLine, { width: 24 }]} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
