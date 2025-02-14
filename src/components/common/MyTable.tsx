import { Table } from "antd";
import React from "react";

const MyTable = ({ columns, dataSource, ...props }: any) => {
  return (
    <Table<any>
      {...props}
      columns={columns}
      dataSource={dataSource}
      rowKey={(record, index) => record.id || record.key || record.hash || index}
      components={{
        header: {
          cell: (props: any) => (
            <th
              {...props}
              style={{
                color: "#989898", // Optional
                backgroundColor: "white",
                fontWeight: "semibold",
              }}
            />
          ),
        },
        body: {
          cell: (props: any) => (
            <td
              {...props}
              style={{
                color: "#7c7c7c",
                verticalAlign: "middle"
              }}
            />
          ),
          row: (props: any) => (
            <tr {...props}>
              {props.children}
            </tr>
          ),
        },
      }}
    />
  );
};

export default MyTable;
