import { Table } from "antd";
import React from "react";

const MyTable = ({ columns, dataSource, ...props }: any) => {
  return (
    <Table<any>
      {...props}
      columns={columns}
      dataSource={dataSource}
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
                verticalAlign: "top"
              }}
            />
          ),
          row: (props: any) => (
            <tr {...props} className="cursor-pointer">
              {props.children}
            </tr>
          ),
        },
      }}
    />
  );
};

export default MyTable;
