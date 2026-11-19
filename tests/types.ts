/// <reference path="../src/SDK.d.ts" />
import SDK from 'gopersonal-react-native-sdk';

async function track() {
  const result = await SDK.createContentImpression('page-id', {
    content: 'experience-id', target: 'target-id', variantId: 'variant-id',
    tags: ['qa'], date: new Date(),
  });
  if (result) {
    const id: string = result.impressionId;
    const skipped: boolean | undefined = result.skipped;
  }
  const id: string | null = await SDK.getContentImpressionId('experience-id');
  await SDK.clickContentImpression(id, { content: 'experience-id', tags: ['qa'] });
  await SDK.openImpression('reco-id');
  // @ts-expect-error openImpression always uses the personal route
  await SDK.openImpression('reco-id', { type: 'recommendation' });
  // @ts-expect-error content is required
  await SDK.createContentImpression('page-id', { target: 'target-id' });
  // @ts-expect-error status belongs to create/open, not click
  await SDK.clickContentImpression(id, { status: 'opened' });
}
