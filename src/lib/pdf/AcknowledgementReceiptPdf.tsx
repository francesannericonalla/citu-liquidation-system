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
import type { AcknowledgementReceiptPdfData } from "./types";

Font.register({
  family: "Times",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman Bold.ttf", fontWeight: "bold" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman Italic.ttf", fontStyle: "italic" },
  ],
});

const S = StyleSheet.create({
  page: { fontFamily: "Times", fontSize: 10, paddingHorizontal: 50, paddingVertical: 36, backgroundColor: "#fff" },
  receiptBlock: { borderWidth: 1, borderColor: "#000", padding: 20, marginBottom: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  logo: { width: 44, height: 44, marginRight: 8 },
  officeName: { fontSize: 11, fontWeight: "bold", flex: 1, textAlign: "center" },
  title: { fontSize: 13, fontWeight: "bold", textAlign: "center", textDecoration: "underline", marginBottom: 12 },
  bodyText: { fontSize: 10, lineHeight: 1.6, textAlign: "justify" },
  italic: { fontStyle: "italic" },
  bold: { fontWeight: "bold" },
  sigSection: { marginTop: 20 },
  sigLabel: { fontSize: 10, marginBottom: 4 },
  sigLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginBottom: 2, marginTop: 16 },
  sigSublabel: { fontSize: 9, color: "#333" },
  dateRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 10 },
  dateLabel: { fontSize: 10 },
  dateLine: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#000", marginLeft: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#000", borderStyle: "dashed", marginVertical: 0 },
});

export function AcknowledgementReceiptPdf({ data }: { data: AcknowledgementReceiptPdfData }) {
  return (
    <Document>
      {data.receipts.map((receipt, idx) => (
        <Page key={receipt.id} size="LETTER" style={S.page}>
          <View style={S.receiptBlock}>
            {/* Office header */}
            <View style={S.headerRow}>
              <Image src="/citu-logo.jpg" style={S.logo} />
              <Text style={S.officeName}>{data.officeName}</Text>
            </View>

            <Text style={S.title}>Acknowledgement Receipt</Text>

            {/* Body */}
            <Text style={S.bodyText}>
              {"Received the amount of "}
              <Text style={S.bold}>{receipt.amountInWords} (₱{receipt.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</Text>
              {" as "}
              {receipt.reasonText}
              {" for the "}
              <Text style={S.italic}>{receipt.eventName}</Text>
              {", conducted by the "}
              {data.officeName}
              {", held on "}
              {receipt.eventDates}
              {" at "}
              {receipt.venue}
              {"."}
            </Text>

            {/* Signature section */}
            <View style={S.sigSection}>
              <Text style={S.sigLabel}>Received by:</Text>
              <View style={S.sigLine} />
              <Text style={S.sigSublabel}>Signature over printed name</Text>

              <View style={S.dateRow}>
                <Text style={S.dateLabel}>Date received:</Text>
                <View style={S.dateLine} />
              </View>
            </View>
          </View>

          {/* Cut line between receipts on same page — only if not last */}
          {idx < data.receipts.length - 1 && (
            <View style={[S.divider, { marginVertical: 10 }]} />
          )}
        </Page>
      ))}
    </Document>
  );
}
