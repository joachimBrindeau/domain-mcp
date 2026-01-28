import { z } from 'zod';
import { DYNADOT_URLS } from '../constants.js';
import type { CompositeTool } from './common.js';
import { p } from './common.js';

export const aftermarketTool: CompositeTool = {
  name: 'dynadot_aftermarket',
  description: `Aftermarket: auctions, backorders, expired domains, marketplace listings. Browse domains: ${DYNADOT_URLS.home}`,
  actions: {
    // Backorders
    backorder_add: {
      command: 'add_backorder_request',
      description: 'Add domain to backorder list',
      params: z.object({ domain: p.domain }),
    },
    backorder_delete: {
      command: 'delete_backorder_request',
      description: 'Remove from backorder list',
      params: z.object({ domain: p.domain }),
    },
    backorder_list: {
      command: 'backorder_request_list',
      description: 'List backorder requests',
    },
    // Regular auctions
    auction_list_open: {
      command: 'get_open_auctions',
      description: 'List open auctions',
      params: z.object({ currency: p.currency.optional() }),
    },
    auction_details: {
      command: 'get_auction_details',
      description: 'Get auction details',
      params: z.object({ auctionId: p.auctionId }),
      transform: (_, input) => ({ auction_id: input.auctionId as string }),
    },
    auction_bids: {
      command: 'get_auction_bids',
      description: 'Get auction bids',
      params: z.object({ auctionId: p.auctionId }),
      transform: (_, input) => ({ auction_id: input.auctionId as string }),
    },
    auction_bid: {
      command: 'place_auction_bid',
      description: 'Place auction bid',
      params: z.object({
        auctionId: p.auctionId,
        bidAmount: p.amount,
        currency: p.currency.optional(),
      }),
      transform: (_, input) => ({
        auction_id: input.auctionId as string,
        bid_amount: input.bidAmount as number,
        currency: (input.currency as string) || 'USD',
      }),
    },
    auction_list_closed: {
      command: 'get_closed_auctions',
      description: 'List closed auctions',
    },
    // Backorder auctions
    backorder_auction_list_open: {
      command: 'get_open_backorder_auctions',
      description: 'List open backorder auctions',
      params: z.object({ currency: p.currency.optional() }),
    },
    backorder_auction_details: {
      command: 'get_backorder_auction_details',
      description: 'Get backorder auction details',
      params: z.object({ auctionId: p.auctionId }),
      transform: (_, input) => ({ auction_id: input.auctionId as string }),
    },
    backorder_auction_bid: {
      command: 'place_backorder_auction_bid',
      description: 'Place backorder auction bid',
      params: z.object({ auctionId: p.auctionId, bidAmount: p.amount }),
      transform: (_, input) => ({
        auction_id: input.auctionId as string,
        bid_amount: input.bidAmount as number,
      }),
    },
    backorder_auction_list_closed: {
      command: 'get_closed_backorder_auctions',
      description: 'List closed backorder auctions',
    },
    // Expired closeouts
    expired_list: {
      command: 'get_expired_closeout_domains',
      description: 'List expired closeout domains',
      params: z.object({ currency: p.currency.optional() }),
    },
    expired_buy: {
      command: 'buy_expired_closeout_domain',
      description: 'Buy expired closeout domain',
      params: z.object({ domain: p.domain, currency: p.currency.optional() }),
    },
    // Marketplace
    listings: {
      command: 'get_listings',
      description: 'Get marketplace listings',
      params: z.object({ currency: p.currency.optional() }),
    },
    listing_details: {
      command: 'get_listing_item',
      description: 'Get listing details',
      params: z.object({ domain: p.domain }),
    },
    buy_now: {
      command: 'buy_it_now',
      description: 'Buy domain from marketplace',
      params: z.object({ domain: p.domain, currency: p.currency.optional() }),
    },
    set_for_sale: {
      command: 'set_for_sale',
      description: 'List domain for sale',
      params: z.object({ domain: p.domain, price: p.amount, currency: p.currency.optional() }),
    },
    remove_from_sale: {
      command: 'remove_domain_sale_setting',
      description: 'Remove domain from marketplace/auction (delist from sale)',
      params: z.object({
        domain: p.domain,
      }),
      transform: (_action, input) => ({
        domain: input.domain as string,
      }),
    },
    // Marketplace confirmations
    afternic_confirm: {
      command: 'set_afternic_confirm_action',
      description: 'Confirm/decline Afternic action',
      params: z.object({ domain: p.domain, action: p.confirmAction }),
    },
    sedo_confirm: {
      command: 'set_sedo_confirm_action',
      description: 'Confirm/decline Sedo action',
      params: z.object({ domain: p.domain, action: p.confirmAction }),
    },
  },
};
