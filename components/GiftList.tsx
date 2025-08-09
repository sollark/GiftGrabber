import { Gift } from "@/database/models/gift.model";
import { FC } from "react";
import GiftComponent from "./GiftComponent";

type GiftListProps = {
  gifts: Gift[];
};

/**
 * Functional GiftList component.
 * Renders a list of gifts using GiftComponent.
 *
 * NOTE: This component passes data only via props.
 * Do not use or duplicate context here. This ensures clarity and prevents coupling.
 */
const GiftList: FC<GiftListProps> = ({ gifts }) => {
  return (
    <div>
      <h3>Gift list</h3>
      <ul>
        {gifts.map((gift: Gift) => (
          <li key={gift._id.toString()}>
            <GiftComponent gift={gift} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GiftList;
