import { useState } from "react";
import "./App.css";
import flatten from "lodash-es/flatten";
import range from "lodash-es/range";
import clamp from "lodash-es/clamp";
import {
  COLS,
  firstXCols,
  itemDirections,
  items,
  puzzleByType,
  solve,
} from "./solver";

type puzzleType = "LEFT" | "CENTER";

const MonthNames = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const WeekNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Calendar(props: {
  type: puzzleType;
  month: number;
  day: number;
  week: number;
  onChange: (params: { month: number; day: number; week: number }) => void;
}) {
  const { type, month, day, onChange, week } = props;
  return (
    <div className="Calendar">
      {type === "LEFT" && (
        <>
          {range(0, 6).map((m) => (
            <div
              className={`item month ${month === m ? "selected" : ""}`}
              key={m}
              onClick={() => onChange({ month: m, day, week })}
            >
              {MonthNames[m]}
            </div>
          ))}
          <div className="item empty" />
          {range(6, 12).map((m) => (
            <div
              className={`item month ${month === m ? "selected" : ""}`}
              key={m}
              onClick={() => onChange({ month: m, day, week })}
            >
              {MonthNames[m]}
            </div>
          ))}
          <div className="item empty" />
        </>
      )}
      {type === "CENTER" && (
        <>
          <div className="item empty" />
          {range(0, 5).map((m) => (
            <div
              className={`item month ${month === m ? "selected" : ""}`}
              key={m}
              onClick={() => onChange({ month: m, day, week })}
            >
              {MonthNames[m]}
            </div>
          ))}
          <div className="item empty" />
          {range(5, 12).map((m) => (
            <div
              className={`item month ${month === m ? "selected" : ""}`}
              key={m}
              onClick={() => onChange({ month: m, day, week })}
            >
              {MonthNames[m]}
            </div>
          ))}
        </>
      )}

      {range(1, 32).map((d) => (
        <div
          className={`item ${day === d ? "selected" : ""}`}
          key={d}
          onClick={() => onChange({ month, day: d, week })}
        >
          {d}
        </div>
      ))}
      {range(1, 5).map((w) => (
        <div
          className={`item ${week === w ? "selected" : ""}`}
          key={w}
          onClick={() => onChange({ month, day, week: w })}
        >
          {WeekNames[w - 1]}
        </div>
      ))}
      {range(1, 5).map((w) => (
        <div className={`item hide`} key={w}></div>
      ))}
      {range(5, 8).map((w) => (
        <div
          className={`item ${week === w ? "selected" : ""}`}
          key={w}
          onClick={() => onChange({ month, day, week: w })}
        >
          {WeekNames[w - 1]}
        </div>
      ))}
    </div>
  );
}

const Colors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A8",
  "#FFBD33",
  "#33FFBD",
  "#7F33FF",
  "#FF3333",
  "#33FFF3",
  "#FF33F3",
];

function SolutionView(props: { solution: { index: number; j: number }[] }) {
  const { solution } = props;

  return (
    <div className="SolutionView">
      {items.map((item, i) => {
        const { index, j } = solution[i];
        const row = Math.floor(index / COLS);
        const col = index % COLS;
        const firstXCol = firstXCols[i][j];
        const direction = itemDirections[i][j];

        const hwDiff = item.length - item[0].length;
        const needDiff =
          direction === 1 ||
          direction === 3 ||
          direction === 4 ||
          direction === 6;
        return (
          <div
            key={i}
            className="SolutionViewItem"
            style={{
              top: row * 50,
              left: (col - firstXCol) * 50,
              width: item[0].length * 50,
              height: item.length * 50,
              transform: [
                `translate3d(${needDiff ? hwDiff * 25 : 0}px, ${
                  needDiff ? hwDiff * -25 : 0
                }px, 0px)`,
                `rotate3d(1, 1, 0, ${Math.floor(direction / 4) * 180}deg)`,
                `rotate3d(0, 0, 1, -${(direction % 4) * 90}deg)`,
              ].join(" "),
            }}
            data-direction={direction}
          >
            {flatten(
              item.map((s, r) =>
                s
                  .split("")
                  .map((_1, c) => (
                    <div
                      key={`${r}_${c}`}
                      className="SolutionViewCell"
                      style={
                        item[r][c] === "x" ? { backgroundColor: Colors[i] } : {}
                      }
                    />
                  ))
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

type AppState = {
  type: puzzleType;
  month: number; // 0 - 11
  day: number; // 1 - 31
  week: number; // 1 - 7
  solutions: { index: number; j: number }[][];
  solutionIndex: number;
};

export default function App() {
  const doSolve = (
    type: puzzleType,
    month: number,
    day: number,
    week: number
  ) => {
    const board = puzzleByType[type].map((row) => row.split(""));
    if (type === "LEFT") {
      board[Math.floor(month / 6)][month % 6] = "x";
    }
    if (type === "CENTER") {
      if (month < 5) {
        board[0][month + 1] = "x";
      } else {
        board[1][month - 5] = "x";
      }
    }
    for (let i = 3; i <= 6; i++) {
      board[6][i] = ".";
    }
    for (let i = 4; i < 7; i++) {
      board[7][i] = ".";
    }
    for (let i = 0; i < 4; i++) {
      board[7][i] = "x";
    }
    if (week <= 4) {
      board[6][week + 2] = "x";
    } else {
      board[7][week - 1] = "x";
    }
    board[Math.floor((day - 1) / 7) + 2][(day - 1) % 7] = "x";
    return solve(board);
  };

  const [state, setState] = useState<AppState>({
    type: "LEFT",
    month: new Date().getMonth(), // 0 - 11
    day: new Date().getDate(), // 1 - 31
    week: new Date().getDay(), // 1 - 7
    solutions: doSolve(
      "LEFT",
      new Date().getMonth(),
      new Date().getDate(),
      new Date().getDay()
    ),
    solutionIndex: 0,
  });

  const { type, month, day, solutions, solutionIndex: index, week } = state;

  const handleChange = ({
    month,
    day,
    week,
  }: {
    week: number;
    month: number;
    day: number;
  }) =>
    setState({
      ...state,
      solutions: doSolve(type, month, day, week),
      solutionIndex: 0,
      month,
      day,
      week,
    });

  return (
    <div className="App">
      <h1>a puzzle a day</h1>
      <div>
        <a href="https://www.dragonfjord.com/product/a-puzzle-a-day/">
          a-puzzle-a-day
        </a>
        <a
          href="https://github.com/ahaoboy/a-puzzle-a-day"
          style={{ marginLeft: 16 }}
        >
          github
        </a>
      </div>
      <div className="Container">
        <Calendar
          type={type}
          month={month}
          day={day}
          week={week}
          onChange={handleChange}
        />
        {solutions[index] && <SolutionView solution={solutions[index]} />}
      </div>
      {solutions.length > 0 ? (
        <div className="flex">
          solutions:
          <input
            value={state.solutionIndex + 1}
            type="range"
            step={1}
            min={1}
            max={solutions.length}
            onChange={(e) => {
              const v = clamp(+e.target.value, 0, state.solutions.length - 1);
              setState({
                ...state,
                solutionIndex: v,
              });
            }}
          />
          {`${state.solutionIndex + 1}/${solutions.length}`}
        </div>
      ) : (
        <div>No solution</div>
      )}
    </div>
  );
}
