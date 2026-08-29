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
import type { CertificationPdfData } from "./types";

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
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 2 },
  logo: { width: 52, height: 52, marginRight: 8 },
  headerText: { textAlign: "center", flex: 1 },
  schoolName: { fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 },
  schoolSub: { fontSize: 8 },
  divider: { borderBottomWidth: 1.5, borderBottomColor: "#000", marginVertical: 3 },
  docTitle: { fontSize: 13, fontWeight: "bold", textAlign: "center", marginVertical: 4, textDecoration: "underline" },
  fieldRow: { flexDirection: "row", marginBottom: 3, alignItems: "flex-end" },
  fieldLabel: { fontSize: 9 },
  fieldValue: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#000", fontSize: 9, paddingBottom: 1, marginLeft: 2 },
  table: { marginTop: 6 },
  tableHeader: { flexDirection: "row", borderWidth: 0.5, borderColor: "#000", backgroundColor: "#f0f0f0" },
  tableRow: { flexDirection: "row", borderLeftWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: "#000" },
  tableRowTotal: { flexDirection: "row", borderWidth: 0.5, borderColor: "#000", backgroundColor: "#f0f0f0" },
  colParticulars: { flex: 3, paddingHorizontal: 4, paddingVertical: 3, borderRightWidth: 0.5, borderRightColor: "#000" },
  colAmount: { flex: 1.2, paddingHorizontal: 4, paddingVertical: 3, textAlign: "right" },
  colHeader: { fontWeight: "bold", textAlign: "center" },
  purposeLabel: { fontSize: 9, fontWeight: "bold", marginTop: 8, marginBottom: 2 },
  purposeBox: { borderWidth: 0.5, borderColor: "#000", minHeight: 40, padding: 4, fontSize: 9 },
  noteText: { fontSize: 7.5, fontStyle: "italic", marginTop: 4, marginBottom: 4 },
  certText: { fontSize: 8, marginTop: 6, marginBottom: 6, lineHeight: 1.4 },
  sigRow: { flexDirection: "row", marginTop: 8, gap: 16 },
  sigBlock: { flex: 1 },
  sigLabel: { fontSize: 8, marginBottom: 2 },
  sigLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginBottom: 1 },
  sigName: { fontSize: 9, fontWeight: "bold", textAlign: "center" },
  sigRole: { fontSize: 8, textAlign: "center", color: "#333" },
  sigId: { fontSize: 7.5, textAlign: "center", color: "#555" },
  notaryItem: { flexDirection: "row", alignItems: "flex-end" },
  notaryItemLabel: { fontSize: 8 },
  notaryItemLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", width: 40, marginLeft: 2 },
});

function peso(n: number): string {
  if (n === 0) return "-";
  return "₱ " + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CertificationPdf({ data }: { data: CertificationPdfData }) {
  // Group entries by category for display
  const grouped = data.entries.reduce<Record<string, typeof data.entries>>((acc, e) => {
    const k = e.categoryName.toUpperCase();
    if (!acc[k]) acc[k] = [];
    acc[k].push(e);
    return acc;
  }, {});

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

        <Text style={S.docTitle}>CERTIFICATION</Text>

        {/* Fields */}
        <View style={S.fieldRow}>
          <Text style={S.fieldLabel}>PR No.: </Text>
          <Text style={[S.fieldValue, { flex: 2 }]}>{data.prNumber}</Text>
          <Text style={[S.fieldLabel, { marginLeft: 8 }]}>Payer Name: </Text>
          <Text style={[S.fieldValue, { flex: 2 }]}>{data.payerName}</Text>
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

        {/* Items table */}
        <View style={S.table}>
          <View style={S.tableHeader}>
            <Text style={[S.colParticulars, S.colHeader]}>EXPENSE ACCOUNTS/ITEMS/PARTICULARS</Text>
            <Text style={[S.colAmount, S.colHeader]}>AMOUNT (PESOS)</Text>
          </View>

          {Object.entries(grouped).map(([category, entries]) => (
            <React.Fragment key={category}>
              <View style={[S.tableRow, { backgroundColor: "#fafafa" }]}>
                <Text style={[S.colParticulars, { fontWeight: "bold" }]}>{category}</Text>
                <Text style={S.colAmount} />
              </View>
              {entries.map((entry, i) => (
                <View key={i} style={S.tableRow}>
                  <Text style={[S.colParticulars, { paddingLeft: 12 }]}>{entry.payee}</Text>
                  <Text style={S.colAmount}>{peso(entry.amount)}</Text>
                </View>
              ))}
            </React.Fragment>
          ))}

          <View style={S.tableRowTotal}>
            <Text style={[S.colParticulars, { fontWeight: "bold" }]}>TOTAL</Text>
            <Text style={[S.colAmount, { fontWeight: "bold" }]}>{peso(data.totalAmount)}</Text>
          </View>
        </View>

        <Text style={S.noteText}>(Please attach the proof of payment issued by the supplier)</Text>

        {/* Purpose */}
        <Text style={S.purposeLabel}>PURPOSE OF THE EXPENSE/PAYMENT</Text>
        <View style={S.purposeBox}>
          <Text>{data.purpose}</Text>
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

        {/* Notary */}
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <Text style={{ fontSize: 8 }}>SUBSCRIBED AND SWORN TO before me this </Text>
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#000", width: 50 }} />
            <Text style={{ fontSize: 8 }}> at </Text>
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#000", flex: 1 }} />
            <Text style={{ fontSize: 8 }}> affiant(s) having exhibited to me her/his/their competence evidence of identity above stated.</Text>
          </View>
          <View style={{ flexDirection: "row", marginTop: 6, gap: 12 }}>
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
