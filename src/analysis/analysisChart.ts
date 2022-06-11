import {
  createCanvas,
  CanvasRenderingContext2D,
  loadImage,
  Image,
} from "canvas";
import { Analysis, DiscordUsers } from "../analysisTyping";
import * as d3 from "d3";
import { User } from "../services/UserManager";
import Color from "color";
import { generateAnalysisForUser } from "./analysisHelpers";
import { sortBy, reverse } from "lodash";

const WIDTH = 1920;
const HEIGHT = 1080;
const MARGIN = 100;
const SPACING = MARGIN / 5;
const KEY_IMAGE_SIZE = 64;
const LINE_WIDTH = MARGIN / 16;

enum Colors {
  Emerald = "#33CA7F",
  MiddleBlueGreen = "#7FCFB6",
  LemonMeringue = "#ECE4B7",
  LightOrange = "#FBD1A2",
  SandyBrown = "#FC9F5B",
  White = "#FFFFFF",
  Black = "#111111",
  Grey = "#666666",
  Maroon = "#A13D63",
}

const renderColors = [
  Colors.Emerald,
  Colors.Maroon,
  Colors.SandyBrown,
  Colors.MiddleBlueGreen,
  Colors.LemonMeringue,
];

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

const DAYS = [
  "SUNDAY",
  "MON AM",
  "MON PM",
  "TUE AM",
  "TUE PM",
  "WED AM",
  "WED PM",
  "THUR AM",
  "THUR PM",
  "FRI AM",
  "FRI PM",
  "SAT AM",
  "SAT PM",
];

const toMinMax = (analysis: Analysis): [number, number][] =>
  analysis.prices.slice(1).map((x) => [x.min, x.max]);

const generateDrawArea =
  (
    ctx: CanvasRenderingContext2D,
    x: d3.ScaleLinear<number, number>,
    y: d3.ScaleLinear<number, number>
  ) =>
  (analysis: [number, number][], fill: string, stroke: string) => {
    const area = d3
      .area()
      .x0((_, i) => x(i))
      .x1((_, i) => x(i))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveMonotoneX)
      .context(ctx);

    ctx.beginPath();
    area(analysis);
    ctx.lineWidth = LINE_WIDTH;
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    ctx.stroke();
    ctx.fill();
  };

export const createChart = async (
  unsortedUsers: Array<User>,
  discordUsers: DiscordUsers
) => {
  let analyses: {
    [id: string]: {
      minMax: [number, number][];
      mostLikely: [number, number][];
      max?: number;
      mostLikelyMax?: number;
      min?: number;
      mostLikelyMin?: number;
      image: Image | undefined;
      probability: string;
    };
  } = {};
  for (const user of unsortedUsers) {
    const id = user.id;
    const userAnalysis = generateAnalysisForUser(id);
    const minMax = toMinMax(userAnalysis[0]);
    const mostLikely = toMinMax(userAnalysis[1] ?? userAnalysis[0]);
    const imageUrl = discordUsers[id]?.imageUrl;
    analyses[id] = {
      minMax,
      mostLikely,
      max: d3.max(minMax, (x) => x[1]),
      mostLikelyMax: d3.max(mostLikely, (x) => x[1]),
      min: d3.min(minMax, (x) => x[0]),
      mostLikelyMin: d3.min(mostLikely, (x) => x[0]),
      image: imageUrl != null ? await loadImage(imageUrl) : undefined,
      probability: ((userAnalysis[1].probability ?? 0) * 100).toFixed(2),
    };
  }
  console.log("Analysis Generated");
  const multipleUsers = unsortedUsers.length > 1;
  const users = reverse(
    sortBy(unsortedUsers, (x) =>
      multipleUsers ? analyses[x.id].mostLikelyMax : analyses[x.id].max
    )
  );

  const x = d3
    .scaleLinear()
    .range([MARGIN, WIDTH - MARGIN])
    .domain([0, 12]);

  const y = d3
    .scaleLinear()
    .range([HEIGHT - MARGIN, MARGIN])
    .domain([
      d3.min(Object.values(analyses), (x) =>
        multipleUsers ? x.mostLikelyMin : x.min
      ) as number,
      d3.max(Object.values(analyses), (x) =>
        multipleUsers ? x.mostLikelyMax : x.max
      ) as number,
    ]);

  const drawArea = generateDrawArea(ctx, x, y);

  ctx.save();
  ctx.textBaseline = "top";
  ctx.fillStyle = Colors.White;
  ctx.strokeStyle = "#666666";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "20px Arial";

  // X AXIS
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.moveTo(MARGIN, HEIGHT - MARGIN);
  ctx.lineTo(WIDTH - MARGIN, HEIGHT - MARGIN);
  ctx.stroke();

  // Y AXIS
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.moveTo(MARGIN, HEIGHT - MARGIN);
  ctx.lineTo(MARGIN, MARGIN);
  ctx.stroke();

  // X MARKERS
  for (let tick of x.ticks()) {
    const xPos = x(tick);
    ctx.beginPath();
    ctx.setLineDash([5, 10]);
    ctx.moveTo(xPos, MARGIN);
    ctx.lineTo(xPos, HEIGHT - (3 * MARGIN) / 4);
    ctx.stroke();
    ctx.fillText(DAYS[tick], xPos, HEIGHT - (3 * MARGIN) / 4);
  }

  for (let tick of y.ticks()) {
    const yPos = y(tick);
    ctx.beginPath();
    ctx.setLineDash([5, 10]);
    ctx.moveTo(MARGIN / 4, yPos);
    ctx.lineTo(WIDTH - MARGIN, yPos);
    ctx.stroke();
    ctx.fillText("" + tick, MARGIN / 4, yPos);
  }

  ctx.restore();
  users.forEach((user, index) => {
    const id = user.id;
    const color = renderColors[index % 5];
    const strokeColor = Color(color).darken(0.1).hex();
    if (!multipleUsers) {
      drawArea(
        analyses[id].minMax,
        Colors.MiddleBlueGreen,
        Color(Colors.MiddleBlueGreen).darken(0.1).hex()
      );
    }
    drawArea(analyses[id].mostLikely, color, strokeColor);
    user.prices.forEach((price, index) => {
      if (price != null && !isNaN(price)) {
        ctx.beginPath();
        ctx.arc(x(index + 1), y(price), MARGIN / 16, 0, 2 * Math.PI);
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = Colors.White;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fill();
      }
    });
  });
  users.forEach(({ id }, index) => {
    const reversedIndex = users.length - 1 - index;
    const color = renderColors[index % 5];
    const darkStrokeColor = Color(color).darken(0.5).hex();

    // Draw Key
    ctx.save();
    ctx.textBaseline = "middle";
    ctx.font = "40px Arial";
    ctx.strokeStyle = darkStrokeColor;
    ctx.fillStyle = color;
    if (analyses[id].image != null) {
      ctx.drawImage(
        analyses[id].image,
        MARGIN,
        HEIGHT - MARGIN * (reversedIndex + 2),
        KEY_IMAGE_SIZE,
        KEY_IMAGE_SIZE
      );
    }

    strokeAndFillText(
      ctx,
      `${discordUsers[id]?.name ?? id} (${analyses[id].probability}%)`,
      MARGIN + KEY_IMAGE_SIZE + SPACING,
      HEIGHT + KEY_IMAGE_SIZE / 2 - MARGIN * (reversedIndex + 2)
    );

    ctx.restore();
  });

  const buffer = canvas.toBuffer("image/png");
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  console.log("Buffer prepared");
  return buffer;
};

const strokeAndFillText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
) => {
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
};
